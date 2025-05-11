import requests, base64, json, os

SD_API_ADDRESS = os.getenv('SD_API_ADDRESS')

async def get_error_img():
    with open("static/error.jpg", "rb") as image_file:
        image_data = image_file.read()
        base64_encoded_data = base64.b64encode(image_data)
        image = base64_encoded_data.decode('utf-8')
        return image
    
async def generate_image_from_sd(prompt, LoRA):
    results = []
    for lora in LoRA:
        if lora == "nolora":
            image = await prompt_to_image(prompt)
        else:
            image = await prompt_to_image(prompt + f" , <lora:{lora}:1>")

        if image == None:
            image = get_error_img()
            print("error on prompt_to_image()")

        results.append({
            "style": f"{lora} style",
            "image": image
        })

    return results

async def prompt_to_image(prompt):
    URL = f"{SD_API_ADDRESS}/sdapi/v1/txt2img"
    
    with open("docs/sd_config.json", "r") as f:
        payload = json.load(f)
    
    payload["prompt"] = prompt
    
    response = requests.post(URL, json=payload, headers={'Content-Type': 'application/json'})
    if response.status_code != 200:
        return {"error": f"prompt_to_image request failed, status code: {response.status_code}", "details": response}
    data = response.json()
    image = data["images"][0]

    return image


async def change_face_from_sd(images, face):
    for image in images:
        image_changed_face = await change_face(image["image"], face)

        if image_changed_face == None:
            image_changed_face = await get_error_img()
            print("error on change_face()")
        
        image["image"] = image_changed_face
    
    return images

async def change_face(image, face):
    try:
        URL = f"{SD_API_ADDRESS}/roop/image" 
        
        with open("docs/roop_config.json", "r") as f:
            payload = json.load(f)
        
        payload["source_image"] = face
        payload["target_image"] = image

        response = requests.post(URL, json=payload, headers={'Content-Type': 'application/json'})
        if response.status_code != 200:
            print(f"change_face request failed, status code: {response.status_code}, details: {response}")
            return None
        data = response.json()
        
        image = data["image"]

        return image
    except Exception as e:
        print(f"Error occurred during request or decoding: {str(e)}")
        return None
    
