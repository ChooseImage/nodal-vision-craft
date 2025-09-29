import { getAPIKeys } from './apiConfig';
import { mockSkyboxImage, mockEnhancedImage, simulateAPIDelay } from './mockData';

export interface GeminiImageRequest {
  prompt: string;
  isEditRequest?: boolean;
  baseImage?: string;
}

export interface GeminiImageResponse {
  imageUrl: string;
  success: boolean;
  error?: string;
}

export const generateSkyboxImage = async (prompt: string): Promise<GeminiImageResponse> => {
  const { geminiApiKey } = getAPIKeys();
  
  // Use mock data for now
  console.log('Generating skybox with prompt:', prompt);
  await simulateAPIDelay(2000, 4000);
  
  if (!geminiApiKey) {
    return {
      imageUrl: mockSkyboxImage,
      success: true,
    };
  }

  try {
    // Actual Gemini API call would go here
    // const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${geminiApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     contents: [{
    //       parts: [{
    //         text: `You are an expert VFX artist. Create a high-resolution, photorealistic, 360-degree equirectangular panorama image suitable for use as an HDRI skybox in a 3D rendering environment. The image should have realistic lighting, shadows, and seamless edges for wrapping. Generate the following scene: ${prompt}`
    //       }]
    //     }],
    //     generationConfig: {
    //       temperature: 0.7,
    //       topK: 40,
    //       topP: 0.95,
    //       maxOutputTokens: 1024,
    //     }
    //   })
    // });

    return {
      imageUrl: mockSkyboxImage,
      success: true,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      imageUrl: mockSkyboxImage,
      success: false,
      error: 'Failed to generate skybox image',
    };
  }
};

export const enhanceImage = async (baseImage: string, prompt?: string): Promise<GeminiImageResponse> => {
  const { geminiApiKey } = getAPIKeys();
  
  console.log('Enhancing image with prompt:', prompt);
  await simulateAPIDelay(3000, 5000);
  
  if (!geminiApiKey) {
    return {
      imageUrl: mockEnhancedImage,
      success: true,
    };
  }

  try {
    // Actual Gemini API call for image-to-image would go here
    return {
      imageUrl: mockEnhancedImage,
      success: true,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      imageUrl: mockEnhancedImage,
      success: false,
      error: 'Failed to enhance image',
    };
  }
};