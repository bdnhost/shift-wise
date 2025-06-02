
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { createPaypalOrder } from '@/api/functions';
import { capturePaypalOrder } from '@/api/functions';

export default function PayPalCheckout({ 
  planId, 
  amount, 
  currency = 'ILS', 
  organizationId, 
  paypalClientId,
  onSuccess, 
  onError, 
  disabled = false 
}) {
  const paypalRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    console.log('PayPal Checkout Component initialized with:', {
      planId, amount, currency, organizationId, paypalClientId, disabled
    });

    if (!paypalClientId) {
      console.error('PayPal Client ID not provided');
      setError('PayPal Client ID לא הוגדר');
      setIsLoading(false);
      return;
    }

    if (window.paypal && window.paypal.Buttons) {
      console.log('PayPal SDK already loaded and Buttons available.');
      setSdkReady(true);
      return;
    }

    console.log('Loading PayPal SDK...');
    const script = document.createElement('script');
    const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${currency}&intent=capture`;
    console.log('PayPal SDK URL:', sdkUrl);
    
    script.src = sdkUrl;
    script.async = true; // Make it async
    script.onload = () => {
      console.log('PayPal SDK script loaded successfully');
      if (window.paypal && window.paypal.Buttons) {
        console.log('window.paypal.Buttons is available.');
        setSdkReady(true);
      } else {
        console.error('PayPal SDK loaded but window.paypal.Buttons not available');
        setError('Failed to initialize PayPal SDK (Buttons not found)');
        setIsLoading(false);
      }
    };
    script.onerror = () => {
      console.error('Failed to load PayPal script');
      setError('Failed to load PayPal script (onerror event)');
      setIsLoading(false);
    };
    document.body.appendChild(script);

    // Cleanup function to remove the script if the component unmounts
    return () => {
        const scripts = document.querySelectorAll(`script[src*="${paypalClientId}"]`);
        scripts.forEach(s => {
            if (s.parentNode) {
                s.parentNode.removeChild(s);
            }
        });
        // Potentially reset window.paypal if safe and necessary, but usually not needed
        // delete window.paypal; // This can be risky if other components use it
        console.log("PayPalCheckout unmounted, script potentially removed.");
    };

  }, [paypalClientId, currency]); // Rerun if paypalClientId or currency changes

  useEffect(() => {
    // This useEffect will run when sdkReady becomes true OR when paypalRef.current gets a value
    if (sdkReady && paypalRef.current) {
      console.log('SDK is ready AND paypalRef.current is available, attempting to render PayPal buttons to element:', paypalRef.current);
      setIsLoading(false);
      
      // Clear previous buttons if any
      while (paypalRef.current.firstChild) {
          paypalRef.current.removeChild(paypalRef.current.firstChild);
      }

      try {
        window.paypal.Buttons({
          createOrder: async () => {
            console.log('PayPal createOrder called');
            try {
              const response = await createPaypalOrder({
                planId, amount, currency, organizationId
              });
              console.log('PayPal order creation response:', response);
              if (response.data && response.data.orderId) {
                console.log('Order ID received:', response.data.orderId);
                return response.data.orderId;
              } else {
                throw new Error(response.data?.error || 'Failed to create PayPal order - no orderId');
              }
            } catch (err) {
              console.error('Error creating PayPal order:', err);
              setError(`שגיאה ביצירת הזמנת תשלום: ${err.message}`);
              if (onError) onError(err);
              throw err;
            }
          },
          
          onApprove: async (data) => {
            console.log('PayPal onApprove called with data:', data);
            try {
              const response = await capturePaypalOrder({
                orderId: data.orderID, planId, amount, currency, organizationId
              });
              console.log('PayPal capture response:', response);
              if (response.data && response.data.status === 'success') {
                if (onSuccess) {
                  onSuccess({
                    transactionId: response.data.paypalTransactionId,
                    subscriptionId: response.data.subscriptionId,
                    planId
                  });
                }
              } else {
                throw new Error(response.data?.error || 'Failed to capture payment - status not success');
              }
            } catch (err) {
              console.error('Error capturing PayPal payment:', err);
              setError(`שגיאה בעיבוד התשלום: ${err.message}`);
              if (onError) onError(err);
            }
          },
          
          onError: (err) => {
            console.error('PayPal Buttons onError called:', err);
            let errorMessage = 'שגיאה בכפתורי PayPal. ';
            if (typeof err === 'string') {
                errorMessage += err;
            } else if (err && err.message) {
                errorMessage += err.message;
            } else {
                errorMessage += 'פרטים נוספים בקונסול.';
            }
            setError(errorMessage);
            if (onError) onError(err);
          },
          
          onCancel: (data) => {
            console.log('PayPal payment cancelled by user:', data);
            setError('התשלום בוטל על ידך.');
          }
        }).render(paypalRef.current).then(() => {
          console.log('PayPal buttons rendered successfully.');
        }).catch((err) => {
          console.error('Error rendering PayPal buttons:', err);
          setError(`שגיאה בהצגת כפתורי PayPal: ${err.message}`);
        });
      } catch (err) {
          console.error('Exception while trying to render PayPal Buttons:', err);
          setError(`שגיאה קריטית באתחול PayPal: ${err.message}`);
      }
    } else if (sdkReady && !paypalRef.current) {
        console.warn("SDK is ready, but paypalRef.current is not available yet. Waiting for ref.");
        // We don't set isLoading to false here, let it wait until ref is available.
    } else if (!sdkReady) {
        console.log("PayPal SDK not ready yet. Waiting for SDK.");
    }
  }, [sdkReady, paypalRef.current, planId, amount, currency, organizationId, onSuccess, onError]); // Added paypalRef.current to dependency array and other relevant props

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => {
            setError(null);
            setIsLoading(true);
            setSdkReady(false); // Force re-evaluation of SDK loading
            // Consider a more robust way to re-trigger script loading if needed
            window.location.reload(); // Simplest way to retry fully
          }}
        >
          נסה שוב
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin ml-2" />
        <span>טוען אפשרויות תשלום...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={paypalRef} className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        {/* PayPal buttons will be rendered here */}
      </div>
      
      {!disabled && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <CreditCard className="w-4 h-4" />
            <span>תשלום מאובטח דרך PayPal</span>
          </div>
        </div>
      )}
    </div>
  );
}
