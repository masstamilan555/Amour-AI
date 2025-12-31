import axios from "axios";

 export const checkAuth = async (setUser) => {
    try {
      const res = await axios.get("/api/auth/me");
       // with proxy you can omit host
      if (res.status !== 200 || !res.data.ok) {
        setUser(null);
        return;
      }
      setUser(res.data?.data);
    } catch (err) {
      setUser(null);
    }
  };