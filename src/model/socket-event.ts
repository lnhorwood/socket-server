export enum SocketEvent {
  AUTHENTICATED = 'authenticated',
  LOGIN = 'login',
  LOGIN_FAILED = 'loginFailed',
  LOGOUT = 'logout',
  LOGOUT_FAILED = 'logoutFailed',
  LOGOUT_SUCCESS = 'logoutSuccess',
  REGISTER = 'register',
  REGISTRATION_FAILED = 'registrationFailed',
  VALIDATE_TOKEN = 'validateToken',
  TOKEN_VALIDATION_FAILED = 'tokenValidationFailed'
}
