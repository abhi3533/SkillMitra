import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const JoinRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/student/signup?ref=${code || ""}`, { replace: true });
  }, [code, navigate]);

  return null;
};

export default JoinRedirect;
