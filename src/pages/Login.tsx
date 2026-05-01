import { Navigate } from "react-router-dom";

// Legacy /login route → redirect to the unified Welcome auth page.
const Login = () => <Navigate to="/" replace />;

export default Login;
