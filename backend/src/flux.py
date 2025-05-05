import requests
import json
import time
import base64

async def get_error_img():
    with open("static/error.jpg", "rb") as image_file:
        image_data = image_file.read()
        base64_encoded_data = base64.b64encode(image_data)
        image = base64_encoded_data.decode('utf-8')
        return image
    
async def generate_image_from_flux(prompt):
    results = []
    image = await prompt_to_image(prompt)

    if image == None:
        image = get_error_img()
        print("error on prompt_to_image()")

    results.append({
        "style": "Recommend",
        "image": image
    })

    return results


async def prompt_to_image(prompt):
    server_ip = "140.116.154.71"
    api_url = f"http://{server_ip}:7862"
    http_output_url = f"http://{server_ip}:8000"

    with open("docs/flux_config.json", "r") as f:
        workflow = json.load(f)

    workflow_str = json.dumps(workflow)
    workflow_str = workflow_str.replace("prompt_here", prompt)
    workflow = json.loads(workflow_str)

    res = requests.post(f"{api_url}/prompt", json={"prompt": workflow})
    res_data = res.json()
    prompt_id = res_data["prompt_id"]

    print(f"🟡 任務已送出，Prompt ID: {prompt_id}")

    while True:
        queue = requests.get(f"{api_url}/queue").json()
        if not queue["queue_pending"] and not queue["queue_running"]:
            print("✅ 任務完成！")
            break
        time.sleep(1)

    image_list = requests.get(http_output_url).text
    import re
    matches = re.findall(r'href="([^"]+\.png)"', image_list)
    if not matches:
        print("⚠️ 找不到圖片。")
        return None

    latest_image = matches[-1]
    image_url = f"{http_output_url}/{latest_image}"
    print(f"🖼️ 找到圖片：{image_url}")

    res = requests.get(image_url)
    if res.status_code != 200:
        print("⚠️ 下載圖片失敗")
        return None
        
    image_data = res.content
    base64_encoded_data = base64.b64encode(image_data)
    base64_image = base64_encoded_data.decode('utf-8')
    
    return base64_image