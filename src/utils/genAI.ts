import { getAPIKeys } from './apiConfig';
import { toast } from '@/hooks/use-toast';

export interface ImageToImageRequest {
  baseImage: string; // base64 encoded image
  prompt: string;
  provider?: 'gemini'; // Extensible for future providers like 'openai', 'anthropic', etc.
}

export interface ImageToImageResponse {
  imageUrl: string; // data URL of the enhanced image
  success: boolean;
  error?: string;
}

export interface TextToImageRequest {
  prompt: string;
  provider?: 'gemini'; // Extensible for future providers like 'openai', 'anthropic', etc.
}

export interface TextToImageResponse {
  imageUrl: string; // data URL of the generated image
  success: boolean;
  error?: string;
}

export interface ImageToVideoRequest {
  baseImage: string; // base64 encoded image or data URL
  prompt: string;
  provider?: 'replicate' | 'mock';
}

export interface ImageToVideoResponse {
  videoUrl: string; // data URL or URL of the generated video
  success: boolean;
  error?: string;
}

/**
 * Convert a data URL to base64 string (removes the data:image/png;base64, prefix)
 */
const dataUrlToBase64 = (dataUrl: string): string => {
  const base64Prefix = dataUrl.indexOf(',') + 1;
  return dataUrl.substring(base64Prefix);
};

/**
 * Generate an image from text using Gemini 2.5 Flash Image API
 * This uses the text-to-image generation capability
 */
export const generateImageWithAI = async (
  request: TextToImageRequest
): Promise<TextToImageResponse> => {
  const { geminiApiKey } = getAPIKeys();
  
  if (!geminiApiKey) {
    toast({
      title: 'API Key Missing',
      description: 'Please add your Gemini API key in settings',
      variant: 'destructive',
    });
    return {
      imageUrl: '',
      success: false,
      error: 'Gemini API key not found',
    };
  }

  const provider = request.provider || 'gemini';

  if (provider === 'gemini') {
    return await generateWithGemini(request.prompt, geminiApiKey);
  }

  // Future providers can be added here
  // if (provider === 'openai') { ... }
  
  return {
    imageUrl: '',
    success: false,
    error: `Provider ${provider} not implemented`,
  };
};

/**
 * Mock enhancement function for dev mode
 * Simulates AI enhancement with a delay and visual indicator
 */
const mockEnhanceSceneWithAI = async (
  baseImage: string,
  prompt: string
): Promise<ImageToImageResponse> => {
  console.log('🎨 Using MOCK API for enhancement (Dev Mode)');
  console.log('🎨 Mock enhancement prompt:', prompt);
  
  try {
    // Simulate API delay (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
    
    // Create a canvas to add a visual indicator that this is mock data
    const img = new Image();
    img.src = baseImage;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    
    // Draw the original image
    ctx.drawImage(img, 0, 0);
    
    // Add a subtle color overlay to simulate enhancement
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)'; // Golden overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add "MOCK" watermark
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    const text = 'MOCK ENHANCED';
    const textWidth = ctx.measureText(text).width;
    const x = canvas.width - textWidth - 10;
    const y = canvas.height - 10;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    
    const enhancedImage = canvas.toDataURL('image/png');
    
    console.log('🎨 Mock enhancement successful');
    toast({
      title: 'Scene Enhanced! (Mock)',
      description: 'Dev mode: Using mock AI enhancement',
    });
    
    return {
      imageUrl: enhancedImage,
      success: true,
    };
  } catch (error) {
    console.error('🎨 Mock enhancement failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    toast({
      title: 'Mock Enhancement Failed',
      description: errorMessage,
      variant: 'destructive',
    });
    
    return {
      imageUrl: baseImage,
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Enhance a 3D scene render to look photorealistic using Gemini 2.5 Flash Image API
 * This uses the "Nano Banana" image-to-image editing capability
 * In dev mode, uses mock API instead
 */
export const enhanceSceneWithAI = async (
  request: ImageToImageRequest,
  isDevMode: boolean = false
): Promise<ImageToImageResponse> => {
  // Use mock API in dev mode
  if (isDevMode) {
    return await mockEnhanceSceneWithAI(request.baseImage, request.prompt);
  }
  const { geminiApiKey } = getAPIKeys();
  
  if (!geminiApiKey) {
    toast({
      title: 'API Key Missing',
      description: 'Please add your Gemini API key in settings',
      variant: 'destructive',
    });
    return {
      imageUrl: request.baseImage,
      success: false,
      error: 'Gemini API key not found',
    };
  }

  const provider = request.provider || 'gemini';

  if (provider === 'gemini') {
    return await enhanceWithGemini(request.baseImage, request.prompt, geminiApiKey);
  }

  // Future providers can be added here
  // if (provider === 'openai') { ... }
  
  return {
    imageUrl: request.baseImage,
    success: false,
    error: `Provider ${provider} not implemented`,
  };
};

/**
 * Gemini 2.5 Flash Image (Nano Banana) - Image to Image Enhancement
 */
const enhanceWithGemini = async (
  baseImage: string,
  prompt: string,
  apiKey: string
): Promise<ImageToImageResponse> => {
  console.log('🎨 Using Gemini 2.5 Flash Image (Nano Banana) for photorealistic enhancement');
  
  try {
    // Convert data URL to base64 if needed
    const base64Image = baseImage.startsWith('data:') 
      ? dataUrlToBase64(baseImage)
      : baseImage;
    
    console.log('🎨 Gemini enhancement prompt:', prompt);
    console.log('🎨 Image size:', base64Image.length, 'characters');
    
    // Call Gemini 2.5 Flash Image API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🎨 Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🎨 Gemini image-to-image response received');

    // Extract image data from response
    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error('No candidates in Gemini response');
    }

    // Look for inline image data in the response
    let imageUrl: string | null = null;
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        // Convert base64 to data URL
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error('No image data found in Gemini response');
    }

    console.log('🎨 Gemini 2.5 Flash Image enhancement successful');
    toast({
      title: 'Scene Enhanced!',
      description: 'Your 3D scene has been made photorealistic with AI',
    });

    return {
      imageUrl,
      success: true,
    };
  } catch (error) {
    console.error('🎨 Gemini enhancement failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    toast({
      title: 'Enhancement Failed',
      description: errorMessage,
      variant: 'destructive',
    });

    return {
      imageUrl: baseImage,
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Gemini 2.5 Flash Image (Nano Banana) - Text to Image Generation
 */
const generateWithGemini = async (
  prompt: string,
  apiKey: string
): Promise<TextToImageResponse> => {
  console.log('🎨 Using Gemini 2.5 Flash Image (Nano Banana) for text-to-image generation');
  
  try {
    console.log('🎨 Gemini generation prompt:', prompt);
    
    // Call Gemini 2.5 Flash Image API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🎨 Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🎨 Gemini text-to-image response received');

    // Extract image data from response
    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error('No candidates in Gemini response');
    }

    // Look for inline image data in the response
    let imageUrl: string | null = null;
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        // Convert base64 to data URL
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error('No image data found in Gemini response');
    }

    console.log('🎨 Gemini 2.5 Flash Image generation successful');
    toast({
      title: 'Image Generated!',
      description: 'Your image has been created with AI',
    });

    return {
      imageUrl,
      success: true,
    };
  } catch (error) {
    console.error('🎨 Gemini generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    toast({
      title: 'Generation Failed',
      description: errorMessage,
      variant: 'destructive',
    });

    return {
      imageUrl: '',
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Convert base64 data URL to Blob URL
 */
const dataUrlToBlobUrl = (dataUrl: string): string => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  return URL.createObjectURL(blob);
};

/**
 * Mock video generation for dev mode
 */
const mockGenerateVideoFromImage = async (
  request: ImageToVideoRequest
): Promise<ImageToVideoResponse> => {
  console.log('🎬 Using MOCK API for video generation (Dev Mode)');
  console.log('🎬 Mock video prompt:', request.prompt);
  
  try {
    // Simulate API delay (3-4 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 1000));
    
    // Mock video URL - using a sample video from the web
    const mockVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    console.log('🎬 Mock video generation successful');
    toast({
      title: 'Video Generated! (Mock)',
      description: 'Dev mode: Using mock video generation',
    });
    
    return {
      videoUrl: mockVideoUrl,
      success: true,
    };
  } catch (error) {
    console.error('🎬 Mock video generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    toast({
      title: 'Mock Video Generation Failed',
      description: errorMessage,
      variant: 'destructive',
    });
    
    return {
      videoUrl: '',
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Upload image to Replicate's file storage
 */
const uploadImageToReplicate = async (
  dataUrl: string,
  apiKey: string
): Promise<string> => {
  // Convert data URL to Blob
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  
  // Create form data
  const formData = new FormData();
  formData.append('content', blob, 'image.png');
  
  // Upload to Replicate
  const uploadResponse = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });
  
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload image: ${uploadResponse.status} - ${errorText}`);
  }
  
  const uploadData = await uploadResponse.json();
  console.log('🎬 Image uploaded to Replicate:', uploadData.urls.get);
  
  return uploadData.urls.get;
};

/**
 * Generate video using Replicate's bytedance/seedance-1-lite model
 */
const generateVideoWithReplicate = async (
  request: ImageToVideoRequest
): Promise<ImageToVideoResponse> => {
  const { replicateApiKey } = getAPIKeys();
  
  if (!replicateApiKey) {
    toast({
      title: 'API Key Missing',
      description: 'Please add your Replicate API key in settings',
      variant: 'destructive',
    });
    return {
      videoUrl: '',
      success: false,
      error: 'Replicate API key not found',
    };
  }

  console.log('🎬 Using Replicate bytedance/seedance-1-lite for video generation');
  console.log('🎬 Video prompt:', request.prompt);
  
  try {
    // Upload image to Replicate if it's a data URL
    let imageUrl: string;
    if (request.baseImage.startsWith('data:')) {
      console.log('🎬 Uploading image to Replicate...');
      imageUrl = await uploadImageToReplicate(request.baseImage, replicateApiKey);
    } else {
      imageUrl = request.baseImage;
    }
    
    // Create prediction
    const createResponse = await fetch('https://api.replicate.com/v1/models/bytedance/seedance-1-lite/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          image: imageUrl,
          prompt: request.prompt,
          fps: 24,
          duration: 5,
          resolution: '720p',
          aspect_ratio: '16:9',
          camera_fixed: false,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('🎬 Replicate API error:', errorText);
      throw new Error(`Replicate API error: ${createResponse.status} - ${errorText}`);
    }

    const prediction = await createResponse.json();
    console.log('🎬 Prediction created:', prediction.id);

    // Poll for completion
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes max (5 second intervals)
    
    while (pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Bearer ${replicateApiKey}`,
          },
        }
      );

      if (!pollResponse.ok) {
        throw new Error(`Failed to poll prediction: ${pollResponse.status}`);
      }

      const pollData = await pollResponse.json();
      console.log('🎬 Prediction status:', pollData.status);

      if (pollData.status === 'succeeded') {
        const videoUrl = pollData.output;
        
        console.log('🎬 Video generation successful');
        toast({
          title: 'Video Generated!',
          description: 'Your AI video clip is ready',
        });

        return {
          videoUrl,
          success: true,
        };
      } else if (pollData.status === 'failed' || pollData.status === 'canceled') {
        throw new Error(`Video generation ${pollData.status}: ${pollData.error || 'Unknown error'}`);
      }

      pollCount++;
    }

    throw new Error('Video generation timed out');
  } catch (error) {
    console.error('🎬 Replicate video generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    toast({
      title: 'Video Generation Failed',
      description: errorMessage,
      variant: 'destructive',
    });

    return {
      videoUrl: '',
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Generate a video from an image using AI
 * Uses mock implementation in dev mode, Replicate API in production
 */
export const generateVideoFromImage = async (
  request: ImageToVideoRequest,
  isDevMode: boolean = false
): Promise<ImageToVideoResponse> => {
  // Use mock API in dev mode
  if (isDevMode) {
    return await mockGenerateVideoFromImage(request);
  }

  const provider = request.provider || 'replicate';

  if (provider === 'replicate') {
    return await generateVideoWithReplicate(request);
  }

  if (provider === 'mock') {
    return await mockGenerateVideoFromImage(request);
  }

  return {
    videoUrl: '',
    success: false,
    error: `Provider ${provider} not implemented`,
  };
};
