import google.generativeai as genai
import os

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

def get_analysis_result(colors, face):
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
    
    analysis_response = model.generate_content([analysis_prompt, face]).text
    return analysis_response


def get_gender(face):
    gender_prompt = "What is the gender of the person in this picture? output ""Male"" or ""Female"""
    gender_response = model.generate_content([gender_prompt, face]).text
    return gender_response


def get_outfit_prompt(analysis_result, face, user_prompt):
    outfit_prompt = f"""
    Analyze the image to determine the suitable outfit for this person and convert this outfit into a prompt for stable diffusion. Use keywords and phrases, separated by commas. Include:

    2. Subject: "Asian, university student, full-body shot"
    3. Analyze the person's hairstyle, hair color, bangs, and if wearing glasses, analyze the details of the glasses (shape, color, thickness).
    4. Outfit details: "casual wear, street fashion, Korean style, shoes"
    5. Pose and expression: "standing pose, natural smile"
    6. Lighting and background: "natural lighting, soft lighting, simple background, white background"
    7. Quality and style: "high quality, detailed, 8k UHD, masterpiece, best quality"


    Format the prompt as a single line of comma-separated keywords, optimized for Stable Diffusion.
    Finally, output only the prompt for stable diffusion in English.
    """
    #     8. Additional user requirements: {user_prompt}


    outfit_response = model.generate_content([outfit_prompt, face]).text
    outfit_response = f"(1{get_gender(face)}: 1.1), " + outfit_response
    if user_prompt != "":
        outfit_response = f"({user_prompt}: 1.1), " + outfit_response
    return outfit_response