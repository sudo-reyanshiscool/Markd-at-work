import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_provider.dart';

class Order {
  final String id;
  final String customerName;
  final String? deadline;
  final String status;
  final String? notes;
  final String createdAt;
  final String updatedAt;
  final List<OrderItem> items;

  Order({
    required this.id,
    required this.customerName,
    this.deadline,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.items = const [],
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'],
        customerName: json['customer_name'],
        deadline: json['deadline'],
        status: json['status'],
        notes: json['notes'],
        createdAt: json['created_at'],
        updatedAt: json['updated_at'],
        items: json['order_items'] != null
            ? (json['order_items'] as List)
                .map((e) => OrderItem.fromJson(e))
                .toList()
            : [],
      );
}

class OrderItem {
  final String id;
  final String orderId;
  final String pieceType;
  final int quantity;
  final List<Customisation> customisations;
  final List<Measurement> measurements;

  OrderItem({
    required this.id,
    required this.orderId,
    required this.pieceType,
    required this.quantity,
    this.customisations = const [],
    this.measurements = const [],
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        id: json['id'],
        orderId: json['order_id'],
        pieceType: json['piece_type'],
        quantity: json['quantity'],
        customisations: json['customisations'] != null
            ? (json['customisations'] as List)
                .map((e) => Customisation.fromJson(e))
                .toList()
            : [],
        measurements: json['measurements'] != null
            ? (json['measurements'] as List)
                .map((e) => Measurement.fromJson(e))
                .toList()
            : [],
      );
}

class Customisation {
  final String id;
  final String orderItemId;
  final String key;
  final String value;

  Customisation({
    required this.id,
    required this.orderItemId,
    required this.key,
    required this.value,
  });

  factory Customisation.fromJson(Map<String, dynamic> json) => Customisation(
        id: json['id'],
        orderItemId: json['order_item_id'],
        key: json['key'],
        value: json['value'],
      );
}

class Measurement {
  final String id;
  final String orderItemId;
  final String key;
  final String value;

  Measurement({
    required this.id,
    required this.orderItemId,
    required this.key,
    required this.value,
  });

  factory Measurement.fromJson(Map<String, dynamic> json) => Measurement(
        id: json['id'],
        orderItemId: json['order_item_id'],
        key: json['key'],
        value: json['value'],
      );
}

class OrdersNotifier extends AsyncNotifier<List<Order>> {
  RealtimeChannel? _channel;

  @override
  Future<List<Order>> build() async {
    ref.onDispose(() => _channel?.unsubscribe());
    _subscribeToRealtime();
    return _fetchOrders();
  }

  Future<List<Order>> _fetchOrders() async {
    final client = ref.read(supabaseProvider);
    final data = await client
        .from('orders')
        .select('*, order_items(*, customisations(*), measurements(*))')
        .order('deadline', ascending: true)
        .order('created_at', ascending: false);
    return (data as List).map((e) => Order.fromJson(e)).toList();
  }

  void _subscribeToRealtime() {
    final client = ref.read(supabaseProvider);
    _channel = client
        .channel('orders-realtime')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'orders',
          callback: (_) => _refresh(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'order_items',
          callback: (_) => _refresh(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'customisations',
          callback: (_) => _refresh(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'measurements',
          callback: (_) => _refresh(),
        )
        .subscribe();
  }

  Future<void> _refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchOrders());
  }

  Future<void> refresh() => _refresh();

  Future<String> createOrder({
    required String customerName,
    String? deadline,
    String? notes,
  }) async {
    final client = ref.read(supabaseProvider);
    final row = await client
        .from('orders')
        .insert({
          'customer_name': customerName,
          if (deadline != null) 'deadline': deadline,
          if (notes != null) 'notes': notes,
        })
        .select('id')
        .single();
    return row['id'];
  }

  Future<void> updateOrderStatus(String orderId, String status) async {
    final client = ref.read(supabaseProvider);
    await client.from('orders').update({'status': status}).eq('id', orderId);
  }

  Future<void> deleteOrder(String orderId) async {
    final client = ref.read(supabaseProvider);
    await client.from('orders').delete().eq('id', orderId);
  }

  Future<String> addItem({
    required String orderId,
    required String pieceType,
    required int quantity,
  }) async {
    final client = ref.read(supabaseProvider);
    final row = await client
        .from('order_items')
        .insert({
          'order_id': orderId,
          'piece_type': pieceType,
          'quantity': quantity,
        })
        .select('id')
        .single();
    return row['id'];
  }

  Future<void> deleteItem(String itemId) async {
    final client = ref.read(supabaseProvider);
    await client.from('order_items').delete().eq('id', itemId);
  }

  Future<void> addCustomisation({
    required String orderItemId,
    required String key,
    required String value,
  }) async {
    final client = ref.read(supabaseProvider);
    await client.from('customisations').insert({
      'order_item_id': orderItemId,
      'key': key,
      'value': value,
    });
  }

  Future<void> deleteCustomisation(String id) async {
    final client = ref.read(supabaseProvider);
    await client.from('customisations').delete().eq('id', id);
  }

  Future<void> addMeasurement({
    required String orderItemId,
    required String key,
    required String value,
  }) async {
    final client = ref.read(supabaseProvider);
    await client.from('measurements').insert({
      'order_item_id': orderItemId,
      'key': key,
      'value': value,
    });
  }

  Future<void> deleteMeasurement(String id) async {
    final client = ref.read(supabaseProvider);
    await client.from('measurements').delete().eq('id', id);
  }
}

final ordersProvider =
    AsyncNotifierProvider<OrdersNotifier, List<Order>>(OrdersNotifier.new);
