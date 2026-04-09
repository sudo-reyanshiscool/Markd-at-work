import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/orders_provider.dart';
import 'create_order_screen.dart';
import 'order_detail_screen.dart';

class OrderListScreen extends ConsumerWidget {
  const OrderListScreen({super.key});

  Color _statusColor(String status) => switch (status) {
        'PENDING' => Colors.orange,
        'IN_PROGRESS' => Colors.blue,
        'DONE' => Colors.green,
        'FLAGGED' => Colors.red,
        _ => Colors.grey,
      };

  String _statusLabel(String status) => switch (status) {
        'IN_PROGRESS' => 'In Progress',
        _ => status[0] + status.substring(1).toLowerCase(),
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(ordersProvider.notifier).refresh(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const CreateOrderScreen()),
        ),
        icon: const Icon(Icons.add),
        label: const Text('New Order'),
      ),
      body: ordersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (orders) {
          if (orders.isEmpty) {
            return const Center(
              child: Text('No orders yet. Tap + to create one.'),
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(ordersProvider.notifier).refresh(),
            child: ListView.builder(
              padding: const EdgeInsets.only(bottom: 88),
              itemCount: orders.length,
              itemBuilder: (context, i) {
                final order = orders[i];
                return Card(
                  margin:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  child: ListTile(
                    title: Text(
                      order.customerName,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      order.deadline != null
                          ? 'Due: ${order.deadline}'
                          : 'No deadline',
                    ),
                    trailing: Chip(
                      label: Text(
                        _statusLabel(order.status),
                        style: const TextStyle(
                            color: Colors.white, fontSize: 12),
                      ),
                      backgroundColor: _statusColor(order.status),
                      padding: EdgeInsets.zero,
                      visualDensity: VisualDensity.compact,
                    ),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => OrderDetailScreen(order: order),
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
