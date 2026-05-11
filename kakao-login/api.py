import os
import requests
from flask import Flask, render_template, redirect, request, session

app = Flask(__name__)
app.secret_key = os.urandom(24)

client_id = os.environ["KAKAO_CLIENT_ID"]            # 카카오 REST API 키 (env에서 로드)
client_secret = os.environ.get("KAKAO_CLIENT_SECRET", "")
domain = "http://localhost:4000"
redirect_uri = domain + "/redirect"
kauth_host = "https://kauth.kakao.com" # 액세스 토큰 요청을 보낼 카카오 인증 서버 주소
kapi_host = "https://kapi.kakao.com"   # 카카오 API 호출 서버 주소

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/authorize")
def authorize():
    # 선택: 사용자에게 추가 동의를 요청하는 경우, scope 값으로 동의항목 ID를 전달
    # 친구 목록, 메시지 전송 기능의 경우, 추가 기능 신청 필요
    # (예: /authorize?scope=friends,talk_message)
    scope_param = ""
    if request.args.get("scope"):
        scope_param = "&scope=" + request.args.get("scope")

    # 카카오 인증 서버로 리다이렉트
    # 사용자 동의 후 리다이렉트 URI로 인가 코드가 전달
    return redirect(
        "{0}/oauth/authorize?response_type=code&client_id={1}&redirect_uri={2}{3}".format(
            kauth_host, client_id, redirect_uri, scope_param))



# 카카오 인증 서버에서 전달받은 인가 코드로 액세스 토큰 발급 요청
@app.route("/redirect")
def redirect_page():
    # 인가 코드 발급 요청에 필요한 파라미터 구성
    data = {
        'grant_type': 'authorization_code',  # 인증 방식 고정값
        'client_id': client_id,              # 내 앱의 REST API 키
        'redirect_uri': redirect_uri,        # 등록된 리다이렉트 URI
        'client_secret': client_secret,      # 클라이언트 시크릿(Client Secret) 사용 시 추가 필요
        'code': request.args.get("code")     # 전달받은 인가 코드
    }

    # 카카오 인증 서버에 액세스 토큰 요청
    resp = requests.post(kauth_host + "/oauth/token", data=data)

    # 발급받은 액세스 토큰을 세션에 저장 (로그인 상태 유지 목적)
    session['access_token'] = resp.json()['access_token']

    # 로그인 완료 후 메인 페이지로 이동
    return redirect("/?login=success")

# 액세스 토큰을 사용해 로그인한 사용자의 정보 조회 요청
@app.route("/profile")
def profile():
    headers = {
        'Authorization': 'Bearer ' + session.get('access_token', '')  # 세션에 저장된 액세스 토큰 전달
    }

    resp = requests.get(kapi_host + "/v2/user/me", headers=headers)  # 사용자 정보 조회 API 요청 전송

    return resp.text  # 조회한 사용자 정보를 클라이언트에 반환

@app.route("/logout")
def logout():
    headers = {
        'Authorization': 'Bearer ' + session.get('access_token', '')  # 세션에 저장된 액세스 토큰 전달
    }
    resp = requests.post(kapi_host + "/v1/user/logout", headers=headers)  # 카카오 API에 로그아웃 요청 전송
    session.pop('access_token', None)  # 세션 삭제 (로그아웃 처리)
    return resp.text  # 응답 결과 클라이언트에 반환

# 연결 해제 요청: 사용자와 앱의 연결을 해제하고 세션 종료
@app.route("/unlink")
def unlink():
    headers = {
        'Authorization': 'Bearer ' + session.get('access_token', '')  # 세션에 저장된 액세스 토큰 전달
    }
    resp = requests.post(kapi_host + "/v1/user/unlink", headers=headers)  # 카카오 API에 연결 해제 요청 전송
    session.pop('access_token', None)  # 세션 삭제 (연결 해제 처리)
    return resp.text  # 응답 결과 클라이언트에 반환

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=4000)
    