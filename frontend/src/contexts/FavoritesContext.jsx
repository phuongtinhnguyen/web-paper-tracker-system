import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getFavorites, addFavorite, removeFavorite } from "../services/API";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  // Use a state that syncs with localStorage token to drive fetch logic
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("access_token"));

  const fetchFavorites = useCallback(async () => {
    if (!authToken) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await getFavorites({ page: 1, limit: 50 });
      const body = res.data ?? {};
      const papers = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body.data?.data)
          ? body.data.data
          : Array.isArray(body)
            ? body
            : [];
      setFavoriteIds(new Set(papers.map((p) => p.id)));
    } catch {
      setFavoriteIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  // Fetch whenever authToken changes (mount, login, logout)
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Listen for auth changes to update authToken
  useEffect(() => {
    const handler = () => {
      setAuthToken(localStorage.getItem("access_token"));
    };
    window.addEventListener("auth-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("auth-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const toggleFavorite = async (paperId) => {
    if (!authToken) {
      alert("Vui lòng đăng nhập để lưu bài báo yêu thích!");
      return;
    }

    const isFav = favoriteIds.has(paperId);

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(paperId);
      else next.add(paperId);
      return next;
    });

    try {
      if (isFav) await removeFavorite(paperId);
      else await addFavorite(paperId);
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(paperId);
        else next.delete(paperId);
        return next;
      });
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, toggleFavorite, loading, refreshFavorites: fetchFavorites, isLoggedIn: !!authToken }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}

export default FavoritesContext;