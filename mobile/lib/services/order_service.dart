import '../constants/api_constants.dart';
import '../models/order.dart';
import '../models/cart.dart';
import 'api_service.dart';

class OrderService {
  final ApiService _apiService = ApiService();

  /// Place a new order
  Future<Order> placeOrder(Cart cart) async {
    final orderRequest = PlaceOrderRequest.fromCart(cart);
    
    final response = await _apiService.post(
      ApiConstants.placeOrder,
      data: orderRequest.toJson(),
    );

    return Order.fromJson(response.data);
  }

  /// Get all orders for current user
  Future<List<Order>> getOrders({
    int? page,
    int? pageSize,
    String? status,
  }) async {
    final queryParams = <String, dynamic>{};
    
    if (page != null) queryParams['page'] = page;
    if (pageSize != null) queryParams['page_size'] = pageSize;
    if (status != null) queryParams['status'] = status;

    final response = await _apiService.get(
      ApiConstants.orders,
      queryParameters: queryParams,
    );

    // Handle both paginated and non-paginated responses
    final data = response.data;
    if (data is Map<String, dynamic> && data.containsKey('results')) {
      // Paginated response
      final List<dynamic> results = data['results'];
      return results.map((json) => Order.fromJson(json)).toList();
    } else if (data is List) {
      // Direct list response
      return data.map((json) => Order.fromJson(json)).toList();
    } else {
      throw Exception('Unexpected response format');
    }
  }

  /// Get order by ID
  Future<Order> getOrder(int id) async {
    final response = await _apiService.get('${ApiConstants.orders}$id/');
    return Order.fromJson(response.data);
  }

  /// Update order payment status
  Future<Order> updateOrderToPaid(int orderId, {
    String? paymentId,
    String? paymentStatus,
    String? paymentUpdateTime,
    String? emailAddress,
  }) async {
    final data = <String, dynamic>{};
    
    if (paymentId != null) data['id'] = paymentId;
    if (paymentStatus != null) data['status'] = paymentStatus;
    if (paymentUpdateTime != null) data['update_time'] = paymentUpdateTime;
    if (emailAddress != null) data['email_address'] = emailAddress;

    final response = await _apiService.put(
      ApiConstants.getOrderPayUrl(orderId),
      data: data,
    );

    return Order.fromJson(response.data);
  }

  /// Cancel order (if allowed)
  Future<Order> cancelOrder(int orderId) async {
    final response = await _apiService.patch(
      '${ApiConstants.orders}$orderId/',
      data: {'status': 'cancelled'},
    );

    return Order.fromJson(response.data);
  }

  /// Request refund for order
  Future<void> requestRefund(int orderId, String reason) async {
    await _apiService.post(
      '${ApiConstants.orders}$orderId/refund/',
      data: {'reason': reason},
    );
  }

  /// Get order statistics for current user
  Future<Map<String, dynamic>> getOrderStats() async {
    final orders = await getOrders();
    
    final stats = <String, dynamic>{
      'total_orders': orders.length,
      'pending_orders': orders.where((o) => !o.isPaid && !o.isDelivered).length,
      'paid_orders': orders.where((o) => o.isPaid && !o.isDelivered).length,
      'delivered_orders': orders.where((o) => o.isDelivered).length,
      'refunded_orders': orders.where((o) => o.isRefunded).length,
      'total_spent': orders.where((o) => o.isPaid).fold(0.0, (sum, o) => sum + o.totalPrice),
    };

    return stats;
  }

  /// Get recent orders
  Future<List<Order>> getRecentOrders({int limit = 5}) async {
    return await getOrders(pageSize: limit);
  }

  /// Get orders by status
  Future<List<Order>> getOrdersByStatus(String status) async {
    return await getOrders(status: status);
  }

  /// Get pending orders
  Future<List<Order>> getPendingOrders() async {
    final orders = await getOrders();
    return orders.where((o) => !o.isPaid && !o.isDelivered && !o.isRefunded).toList();
  }

  /// Get paid orders
  Future<List<Order>> getPaidOrders() async {
    final orders = await getOrders();
    return orders.where((o) => o.isPaid && !o.isDelivered).toList();
  }

  /// Get delivered orders
  Future<List<Order>> getDeliveredOrders() async {
    final orders = await getOrders();
    return orders.where((o) => o.isDelivered).toList();
  }

  /// Check if order can be cancelled
  bool canCancelOrder(Order order) {
    return order.canBeCancelled;
  }

  /// Check if order can be refunded
  bool canRefundOrder(Order order) {
    return order.canBeRefunded;
  }

  /// Calculate order summary
  Map<String, double> calculateOrderSummary(Cart cart) {
    return {
      'items_price': cart.itemsPrice,
      'shipping_price': cart.shippingPrice,
      'tax_price': cart.taxPrice,
      'discount_amount': cart.discountAmount,
      'total_price': cart.totalPrice,
    };
  }

  /// Validate order before placing
  bool validateOrder(Cart cart) {
    if (cart.isEmpty) return false;
    if (cart.shippingAddress == null) return false;
    if (cart.paymentMethod.isEmpty) return false;
    if (cart.totalPrice <= 0) return false;
    
    return true;
  }

  /// Get order status display text
  String getOrderStatusText(Order order) {
    return order.status;
  }

  /// Get order status color
  String getOrderStatusColor(Order order) {
    return order.statusColor;
  }

  /// Format order date
  String formatOrderDate(Order order) {
    final date = order.createdDate;
    return '${date.day}/${date.month}/${date.year}';
  }

  /// Format order time
  String formatOrderTime(Order order) {
    final date = order.createdDate;
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  /// Get order items count
  int getOrderItemsCount(Order order) {
    return order.totalItems;
  }

  /// Check if order has multiple items
  bool hasMultipleItems(Order order) {
    return order.totalItems > 1;
  }
}
