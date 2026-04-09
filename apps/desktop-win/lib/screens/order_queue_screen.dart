import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/orders_provider.dart';
import 'factory_order_detail_screen.dart';

class OrderQueueScreen extends ConsumerWidget {
  const OrderQueueScreen({super.key});

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
        title: const Text('Order Queue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(ordersProvider.notifier).refresh(),
          ),
        ],
      ),
      body: ordersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (orders) {
          // Filter out DONE orders from the active queue, show them at the bottom
          final active =
              orders.where((o) => o.status != 'DONE').toList();
          final done =
              orders.where((o) => o.status == 'DONE').toList();

          if (orders.isEmpty) {
            return const Center(
              child: Text('No orders in the queue.'),
            );
          }

          return ListView(
            padding: const EdgeInsets.all(12),
            children: [
              if (active.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    'Active Orders (${active.length})',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                ...active.map((order) => _buildOrderTile(
                    context, ref, order)),
              ],
              if (done.isNotEmpty) ...[
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    'Completed (${done.length})',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                        ),
                  ),
                ),
                ...done.map((order) => _buildOrderTile(
                    context, ref, order)),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _buildOrderTile(BuildContext context, WidgetRef ref, Order order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        title: Text(
          order.customerName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Row(
          children: [
            if (order.deadline != null) ...[
              const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
              const SizedBox(width: 4),
              Text(order.deadline!),
              const SizedBox(width: 12),
            ],
            Text('${order.items.length} item(s)',
                style: const TextStyle(color: Colors.grey)),
          ],
        ),
        trailing: Chip(
          label: Text(
            _statusLabel(order.status),
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
          backgroundColor: _statusColor(order.status),
          padding: EdgeInsets.zero,
          visualDensity: VisualDensity.compact,
        ),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => FactoryOrderDetailScreen(order: order),
          ),
        ),
      ),
    );
  }
}
