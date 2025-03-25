import google.generativeai as genai
import os

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

def get_analysis_result(colors, img_pil):
    analysis_prompt = f"""
    This is a personal color analysis of a person's photo:
    - Hair color: {colors['頭髮']}
    - Skin tone: {colors['膚色']}
    - Lip color: {colors['嘴唇']}

    Please analyze the above color information from the perspective of a professional Korean personal color consultant:
    1. Determine the suitable personal color season
    2. Recommend suitable makeup shades
    3. Suggest suitable clothing color combinations
    4. Provide hair color suggestions

    Please respond in Traditional Chinese, avoid using Korean, and provide detailed explanations. Use Markdown.
    """
    
    analysis_response = model.generate_content([analysis_prompt, img_pil])
    return analysis_response.text


def get_gender(img_pil):
    gender_prompt = "What is the gender of the person in this picture?"
    gender_response = model.generate_content([gender_prompt, img_pil])
    return gender_response.text


def get_outfit_prompt(analysis_result, img_pil):
    outfit_prompt = f"""
    Analyze the image to determine the suitable outfit for this person and convert this outfit into a prompt for stable diffusion. Use keywords and phrases, separated by commas. Include:
    1. Subject: "{get_gender(img_pil)}, Asian, university student, full-body shot, {analysis_result}",
    2. Analyze the person's hairstyle, bangs, and if wearing glasses, analyze the details of the glasses (shape, color, thickness).
    3. Outfit details: "casual wear, street fashion, Korean style, shoes"
    4. Pose and expression: "standing pose, natural smile"
    5. Lighting and background: "natural lighting, soft lighting, simple background, white background"
    6. Quality and style: "high quality, detailed, 8k UHD, masterpiece, best quality"
    
    Format the prompt as a single line of comma-separated keywords, optimized for Stable Diffusion.
    Finally, output only the prompt for stable diffusion.
    """
    
    outfit_response = model.generate_content([outfit_prompt, img_pil])
    return outfit_response.text
    