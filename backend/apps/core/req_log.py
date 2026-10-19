import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print(f"INCOMING REQUEST: {request.method} {request.get_full_path()}")
        response = self.get_response(request)
        print(f"OUTGOING RESPONSE: {response.status_code} for {request.method} {request.get_full_path()}")
        return response
