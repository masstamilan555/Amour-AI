export const isAdmin = (req, res, next) => {
  // console.log("req.user", req.user);
  
  // adjust to your User model role field; here I assume req.user.role === 'admin'
  if (!req.user) return res.status(401).json({ ok:false, error: "unauthorized" });
  if (!req.user?.adminAccess) return res.status(403).json({ ok:false, error: "forbidden" });
  next();
};
