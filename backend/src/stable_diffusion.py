import requests, base64, json, os, io

SD_API_ADDRESS = os.getenv('SD_API_ADDRESS')

def get_error_img():
    with open("static/error.jpg", "rb") as image_file:
        image_data = image_file.read()
        base64_encoded_data = base64.b64encode(image_data)
        image = base64_encoded_data.decode('utf-8')
        return image
    
async def generate_image_from_sd(prompt, LoRA):
    results = []
    for lora in LoRA:
        print("generating image from sd: ", lora)
        if lora == "nolora":
            image = await prompt_to_image(prompt)
        else:
            image = await prompt_to_image(prompt + f", {lora}, <lora:{lora}:1>")

        results.append({
            "style": f"{lora} style",
            "image": image
        })
    return results

async def change_face_from_sd(images, face):
    print("changing face")

    for image in images:
        image_changed_face = await change_face(image["image"], face)
        
        image["image"] = image_changed_face
    
    return images
    
async def prompt_to_image(prompt):
    try:
        URL = f"{SD_API_ADDRESS}/sdapi/v1/txt2img"
        
        with open("docs/sd_config.json", "r") as f:
            payload = json.load(f)
        
        payload["prompt"] = prompt
        
        response = requests.post(URL, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status()

        data = response.json()
        image = data["images"][0]

        return image
    except Exception as e:
        print(f"[sd prompt_to_image] {str(e)}")
        return get_error_img()


async def change_face(image, face):
    try:
        URL = f"{SD_API_ADDRESS}/roop/image" 
        
        with open("docs/roop_config.json", "r") as f:
            payload = json.load(f)
        
        payload["source_image"] = face
        payload["target_image"] = image

        response = requests.post(URL, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status()

        data = response.json()
        image = data["image"]

        return image
    except Exception as e:
        print(f"[sd change_face] {str(e)}")
        return get_error_img()
    
