from flask import Flask, request, jsonify
import google.generativeai as genai

app = Flask(__name__)

genai.configure(api_key="AIzaSyB0wmZv-wCr2jfA3c1oig0r1wFDaRwfG4A")
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.json
        user_prompt = data.get("prompt", "")

        system_instruction = "أنت مساعد ذكي داخل سكربت KAZU HUB في روبلوكس ماب بروكهافن. جاوب بلهجة عراقية هكرية ومختصرة."
        response = model.generate_content(system_instruction + "\nاللاعب يسأل: " + user_prompt)
        return jsonify({"answer": response.text})
    except Exception as e:
        return jsonify({"answer": "السيرفر مشغول حالياً، جرب لاحقاً."})

@app.route('/')
def home():
    return "KAZU AI Proxy is Live!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
