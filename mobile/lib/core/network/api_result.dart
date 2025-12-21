// Result wrapper for API calls
class ApiResult<T> {
  final T? data;
  final String? error;
  final bool isSuccess;

  ApiResult.success(this.data)
      : error = null,
        isSuccess = true;

  ApiResult.error(this.error)
      : data = null,
        isSuccess = false;
}