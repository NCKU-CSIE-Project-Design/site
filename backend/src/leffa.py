from gradio_client import Client, handle_file
import os, base64

LEFFA_API_URL = os.getenv("LEFFA_API_URL")

def get_error_img():
    with open("static/error.jpg", "rb") as image_file:
        image_data = image_file.read()
        base64_encoded_data = base64.b64encode(image_data)
        image = base64_encoded_data.decode('utf-8')
        return image
	
def predict_virtual_tryon(body_path: str, garment_path: str, garment_type: str):
	try:
		garment_type_map = {
			'Upper Clothes': 'upper_body',
			'Lower Clothes': 'lower_body',
			'Dresses': 'dresses'
		}
		garment_type = garment_type_map[garment_type]

		# client = Client(LEFFA_API_URL)
		client = Client("franciszzj/Leffa")
		result = client.predict(
				src_image_path=handle_file(body_path),
				ref_image_path=handle_file(garment_path),
				ref_acceleration=True,
				step=30,
				scale=2.5,
				seed=42,
				vt_model_type="viton_hd" if garment_type == "upper_body" else "dress_code",
				vt_garment_type=garment_type,
				vt_repaint=False,
				api_name="/leffa_predict_vt"
			)
		print(result)

		with open(result[0], "rb") as image_file:
			image_data = image_file.read()
			base64_encoded_data = base64.b64encode(image_data)
			return base64_encoded_data.decode('utf-8')
	
	except Exception as e:
		print(f"[leffa predict_virtual_tryon] {str(e)}")
		return get_error_img()