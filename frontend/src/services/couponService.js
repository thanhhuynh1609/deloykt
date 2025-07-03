import httpService from './httpService';

export const fetchCoupons = () => httpService.get('/api/coupons/');
export const createCoupon = (data) => httpService.post('/api/coupons/', data);
export const updateCoupon = (id, data) => httpService.put(`/api/coupons/${id}/`, data);
export const deleteCoupon = (id) => httpService.delete(`/api/coupons/${id}/`);