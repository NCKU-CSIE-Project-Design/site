import google.generativeai as genai
import os

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

async def get_analysis_result(colors, face):
    analysis_prompt = f"""
    This is a personal color analysis of a person's photo:
    - Hair color: {colors['hair']}
    - Skin tone: {colors['skin']}
    - Lip color: {colors['lips']}

    Please analyze the above color information from the perspective of a professional Korean personal color consultant:
    1. Determine the suitable personal color season
    2. Recommend suitable makeup shades
    3. Suggest suitable clothing color combinations
    4. Provide hair color suggestions

    Please respond in Traditional Chinese, avoid using Korean, and provide detailed explanations. Use Markdown.
    """
    
    response = await model.generate_content_async(
        [analysis_prompt, face],
        stream=True
    )
    
    async for chunk in response:
        if chunk.text:
            yield chunk.text


def get_gender(face):
    gender_prompt = "What is the gender of the person in this picture? output ""Boy"" or ""Girl"""
    gender_response = model.generate_content([gender_prompt, face]).text
    return gender_response

def get_hair(face):
    hair_prompt = "What is the hair style and hair color of the person in this picture?"
    hair_response = model.generate_content([hair_prompt, face]).text
    return hair_response

def get_glasses(face):
    glasses_prompt = "What is the details of the glasses (shape, color, thickness) of the person in this picture?"
    glasses_response = model.generate_content([glasses_prompt, face]).text
    return glasses_response

def get_outfit_prompt(face, user_prompt):
    outfit_prompt = f"""
    Analyze the image to determine the suitable outfit for this person and convert this outfit into a prompt for stable diffusion. Use keywords and phrases, separated by commas. Include:

    1. Subject: "Asian, university student"
    2. {get_hair(face)}
    3. {get_glasses(face)}
    4. Outfit details: "casual wear, street fashion, Korean style, shoes"
    5. Lighting and background: "natural lighting, soft lighting, simple background, white background"
    6. Quality and style: "high quality, detailed, 8k UHD, masterpiece, best quality"

    Format the prompt as a single line of comma-separated keywords, optimized for Stable Diffusion.
    Finally, output only the prompt for stable diffusion in English.
    """

    outfit_response = f"(full body: 1.5), (1 {get_gender(face)}: 1.5), "
    outfit_response += model.generate_content([outfit_prompt, face]).text
    
    # add user prompt
    if user_prompt != "":
        user_prompt = translate_to_english(user_prompt)
        outfit_response += f", ({user_prompt}: 1.1)"

    outfit_response = outfit_response.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    return outfit_response


def translate_to_english(text):
    translate_prompt = f"Translate to English if Chinese, otherwise return as is: {text}"
    return model.generate_content(translate_prompt).text.strip()
