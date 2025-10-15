import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); 

  const BACKEND_URL = "http://192.168.1.120:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/login`, {
      username,
      password 

      },{ withCredentials: true });
      login(res.data.token, res.data.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-neutral-light px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-card w-[360px] sm:w-[420px]">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
         <label htmlFor="username" className="sr-only">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className=" w-full rounded-xl border border-gray-300
                      focus-visible:outline-none
                      focus-visible:border-emerald-500
                      focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0
                      p-3"
        />
         <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-neutral-dark p-3 rounded-2xl rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
        <button type="submit"
                disabled={!username || !password}
                className="bg-blue-600 text-white px-4 py-3 rounded w-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
                {loading ? "Signing in…" : "Login"}
        </button>
      </form>
    </div>
  );
}
