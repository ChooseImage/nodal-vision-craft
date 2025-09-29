import { getAPIKeys } from './apiConfig';
import { mockVideoUrl, simulateAPIDelay } from './mockData';

export interface VideoGenerationRequest {
  firstFrame: string;
  prompt: string;
}

export interface VideoGenerationResponse {
  videoUrl: string;
  success: boolean;
  error?: string;
  predictionId?: string;
}

export const generateVideo = async (request: VideoGenerationRequest): Promise<VideoGenerationResponse> => {
  const { replicateApiKey } = getAPIKeys();
  
  console.log('Generating video with prompt:', request.prompt);
  await simulateAPIDelay(8000, 12000); // Video generation takes longer
  
  if (!replicateApiKey) {
    return {
      videoUrl: mockVideoUrl,
      success: true,
    };
  }

  try {
    // Actual Replicate API call would go here
    // const response = await fetch('https://api.replicate.com/v1/predictions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${replicateApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     version: "veo-3-fast-version-id", // Replace with actual version
    //     input: {
    //       first_frame: request.firstFrame,
    //       prompt: request.prompt,
    //       num_frames: 25,
    //       fps: 8
    //     }
    //   })
    // });

    return {
      videoUrl: mockVideoUrl,
      success: true,
    };
  } catch (error) {
    console.error('Replicate API error:', error);
    return {
      videoUrl: mockVideoUrl,
      success: false,
      error: 'Failed to generate video',
    };
  }
};