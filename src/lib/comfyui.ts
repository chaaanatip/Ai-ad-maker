import fs from 'fs';
import path from 'path';

const COMFY_URL = "http://127.0.0.1:8188";

export async function uploadImageToComfy(base64Data: string, filename: string) {
  const binary = Buffer.from(base64Data.split(",")[1] || base64Data, "base64");
  const blob = new Blob([binary], { type: "image/png" });
  const formData = new FormData();
  formData.append("image", blob, filename);
  
  const res = await fetch(`${COMFY_URL}/upload/image`, {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) throw new Error("Failed to upload image to ComfyUI");
  const data = await res.json();
  return data.name; // e.g., "product.png"
}

export async function generateComfyImage(imageName: string, maskName: string, prompt: string) {
  const workflow = {
    "3": {
      "inputs": {
        "seed": Math.floor(Math.random() * 1000000),
        "steps": 30,
        "cfg": 8.0,
        "sampler_name": "euler_ancestral",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["11", 0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": { "ckpt_name": "sd-v1-5-inpainting.ckpt" },
      "class_type": "CheckpointLoaderSimple"
    },
    "6": {
      "inputs": { "text": prompt, "clip": ["4", 1] },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": { "text": "bad quality, blurry, deformed, floating, text, watermark", "clip": ["4", 1] },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": { "samples": ["3", 0], "vae": ["4", 2] },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": { "filename_prefix": "comfy_ad", "images": ["8", 0] },
      "class_type": "SaveImage"
    },
    "11": {
      "inputs": { "grow_mask_by": 6, "pixels": ["12", 0], "vae": ["4", 2], "mask": ["13", 0] },
      "class_type": "VAEEncodeForInpaint"
    },
    "12": {
      "inputs": { "image": imageName, "upload": "image" },
      "class_type": "LoadImage"
    },
    "13": {
      "inputs": { "image": maskName, "channel": "red", "upload": "image" },
      "class_type": "LoadImageMask"
    }
  };

  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow })
  });

  if (!res.ok) throw new Error("Failed to queue prompt in ComfyUI");
  
  const data = await res.json();
  const promptId = data.prompt_id;

  // Poll for completion
  return new Promise<string>((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const histRes = await fetch(`${COMFY_URL}/history/${promptId}`);
        const histData = await histRes.json();
        
        if (histData[promptId]) {
          clearInterval(interval);
          const outputs = histData[promptId].outputs;
          for (const nodeId in outputs) {
            const nodeOutput = outputs[nodeId];
            if (nodeOutput.images && nodeOutput.images.length > 0) {
              const filename = nodeOutput.images[0].filename;
              const subfolder = nodeOutput.images[0].subfolder;
              const type = nodeOutput.images[0].type;
              
              // Fetch the image
              const imgRes = await fetch(`${COMFY_URL}/view?filename=${filename}&subfolder=${subfolder}&type=${type}`);
              const arrayBuffer = await imgRes.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              resolve(`data:image/png;base64,${base64}`);
              return;
            }
          }
          reject(new Error("No image found in ComfyUI output"));
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);
    
    // Timeout after 3 minutes
    setTimeout(() => {
      clearInterval(interval);
      reject(new Error("ComfyUI generation timed out"));
    }, 180000);
  });
}
