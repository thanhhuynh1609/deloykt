import React, { createContext, useState, useEffect, useContext } from 'react';
import httpService from '../services/httpService';
import UserContext from './userContext';

export const FavoriteContext = createContext();

export const FavoriteProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    if (userInfo) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [userInfo]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data } = await httpService.get('/api/favorites/');
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (productId) => {
    try {
      await httpService.post('/api/favorites/', { product_id: productId });
      fetchFavorites();
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      await httpService.delete('/api/favorites/', { data: { product_id: productId } });
      fetchFavorites();
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const isFavorite = (productId) => {
    return favorites.some(product => product.id === productId);
  };

  return (
    <FavoriteContext.Provider value={{ 
      favorites, 
      loading, 
      addToFavorites, 
      removeFromFavorites, 
      isFavorite 
    }}>
      {children}
    </FavoriteContext.Provider>
  );
};
