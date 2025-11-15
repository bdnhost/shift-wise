/**
 * Integrations layer - 100% Local and Free
 * Implements file upload (via DataURL), email (mock), LLM (mock), and other integrations
 */

/**
 * Upload a file - stores it as base64 DataURL (works offline!)
 * @param {Object} params
 * @param {File} params.file - File to upload
 * @returns {Promise<Object>} { file_url: string, file_data: string }
 */
export async function UploadFile({ file }) {
  try {
    // Convert file to base64 DataURL for local storage
    const file_data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // For compatibility, use the data URL as the file_url
    // This works completely offline!
    return {
      file_url: file_data,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Extract data from uploaded file - basic CSV parsing (works offline!)
 * @param {Object} params
 * @param {string} params.file_url - URL or DataURL of uploaded file
 * @param {Object} params.json_schema - JSON schema for extraction
 * @returns {Promise<Object>} { status: string, output: any, details: string }
 */
export async function ExtractDataFromUploadedFile({ file_url, json_schema }) {
  try {
    console.log('ExtractDataFromUploadedFile called');

    // If it's a DataURL, extract the text
    let text;
    if (file_url.startsWith('data:')) {
      const base64 = file_url.split(',')[1];
      text = atob(base64);
    } else {
      // Try to fetch as URL
      const response = await fetch(file_url);
      text = await response.text();
    }

    // Basic CSV parsing
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      return {
        status: 'error',
        output: null,
        details: 'CSV file is empty or has no data rows'
      };
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Handle CSV properly (with quotes)
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      data.push(row);
    }

    return {
      status: 'success',
      output: data,
      details: 'Successfully parsed ' + data.length + ' rows from CSV'
    };
  } catch (error) {
    console.error('Error extracting data from file:', error);
    return {
      status: 'error',
      output: null,
      details: error.message
    };
  }
}

/**
 * Invoke LLM (Mock - requires external API)
 * @param {Object} params
 * @param {string} params.prompt - Prompt for the LLM
 * @param {string} params.model - Model to use
 * @returns {Promise<Object>}
 */
export async function InvokeLLM({ prompt, model = 'gpt-3.5-turbo' }) {
  console.log('📝 Mock LLM invoked:', { prompt: prompt.substring(0, 100), model });

  return {
    response: 'Mock LLM response (requires OpenAI API integration)',
    model,
    usage: { tokens: 0 }
  };
}

/**
 * Send email (Mock)
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body
 * @returns {Promise<Object>}
 */
export async function SendEmail({ to, subject, body }) {
  console.log('📧 Mock Email:');
  console.log('  To:', to);
  console.log('  Subject:', subject);
  console.log('  Body:', body.substring(0, 100) + '...');

  return {
    id: 'MOCK_EMAIL_' + Date.now(),
    status: 'sent (mock)'
  };
}

/**
 * Generate image (Mock)
 * @param {Object} params
 * @param {string} params.prompt - Image generation prompt
 * @param {string} params.size - Image size
 * @returns {Promise<Object>}
 */
export async function GenerateImage({ prompt, size = '1024x1024' }) {
  console.log('🖼️ Mock Image Generation:', { prompt, size });

  return {
    url: 'https://via.placeholder.com/' + size.replace('x', '/') + '?text=' + encodeURIComponent(prompt),
    prompt,
    size
  };
}

// Core integrations object (for compatibility)
export const Core = {
  UploadFile,
  ExtractDataFromUploadedFile,
  InvokeLLM,
  SendEmail,
  GenerateImage
};

export default {
  Core,
  UploadFile,
  ExtractDataFromUploadedFile,
  InvokeLLM,
  SendEmail,
  GenerateImage
};
