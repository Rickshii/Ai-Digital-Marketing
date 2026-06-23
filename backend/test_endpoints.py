import urllib.request, urllib.parse, json, sys

base = 'http://localhost:8000'
passed = 0
failed = 0

def post_form(url, data):
    encoded = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=encoded)
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    return urllib.request.urlopen(req, timeout=10)

def get_auth(url, token):
    req = urllib.request.Request(url)
    req.add_header('Authorization', 'Bearer ' + token)
    return urllib.request.urlopen(req, timeout=10)

def test(label, fn):
    global passed, failed
    try:
        result = fn()
        print(f'[PASS] {label} -> {result}')
        passed += 1
        return result
    except Exception as e:
        print(f'[FAIL] {label} -> {e}')
        failed += 1
        return None

# Test login
resp = post_form(base + '/api/auth/login', {'username': 'admin@example.com', 'password': 'admin123'})
data = json.loads(resp.read())
token = data['access_token']
user = data['user']
print('[PASS] LOGIN admin@example.com | role=' + user['role'])
passed += 1

# Test demo login
test('LOGIN demo@marketerai.com', lambda: json.loads(
    post_form(base + '/api/auth/login', {'username': 'demo@marketerai.com', 'password': 'demo1234'}).read()
)['user']['email'])

# Test user login
test('LOGIN user@example.com', lambda: json.loads(
    post_form(base + '/api/auth/login', {'username': 'user@example.com', 'password': 'password123'}).read()
)['user']['email'])

# Auth endpoints
test('/auth/me', lambda: json.loads(get_auth(base + '/api/auth/me', token).read())['email'])
test('/subscription/status', lambda: 'has_access=' + str(json.loads(get_auth(base + '/api/subscription/status', token).read())['has_access']))
test('/subscription/plans', lambda: str(len(json.loads(urllib.request.urlopen(base + '/api/subscription/plans', timeout=5).read()))) + ' plans')
test('/subscription/qr-url', lambda: json.loads(urllib.request.urlopen(base + '/api/subscription/qr-url', timeout=5).read())['qr_image_url'])
test('/admin/stats', lambda: 'total_users=' + str(json.loads(get_auth(base + '/api/admin/stats', token).read())['total_users']))
test('/admin/users', lambda: str(len(json.loads(get_auth(base + '/api/admin/users', token).read()))) + ' users')
test('/admin/plans', lambda: str(len(json.loads(get_auth(base + '/api/admin/plans', token).read()))) + ' plans')
test('/business/', lambda: str(len(json.loads(get_auth(base + '/api/business/', token).read()))) + ' profiles')
test('/audit/', lambda: str(len(json.loads(get_auth(base + '/api/audit/', token).read()))) + ' audits')
test('/social/', lambda: str(len(json.loads(get_auth(base + '/api/social/', token).read()))) + ' analyses')
test('/strategy/', lambda: str(len(json.loads(get_auth(base + '/api/strategy/', token).read()))) + ' strategies')
test('/reports/', lambda: str(len(json.loads(get_auth(base + '/api/reports/', token).read()))) + ' reports')
test('/admin/reports', lambda: str(len(json.loads(get_auth(base + '/api/admin/reports', token).read()))) + ' reports')
test('/admin/payments/pending', lambda: str(len(json.loads(get_auth(base + '/api/admin/payments/pending', token).read()))) + ' pending')
test('/admin/platform-qr', lambda: str(json.loads(get_auth(base + '/api/admin/platform-qr', token).read()).get('qr_image_url', 'None')))

print()
print(f'Results: {passed} PASSED, {failed} FAILED')
if failed > 0:
    sys.exit(1)
