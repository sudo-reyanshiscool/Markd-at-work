import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/orders_provider.dart';

class FactoryOrderDetailScreen extends ConsumerStatefulWidget {
  final Order order;
  const FactoryOrderDetailScreen({super.key, required this.order});

  @override
  ConsumerState<FactoryOrderDetailScreen> createState() =>
      _FactoryOrderDetailScreenState();
}

class _FactoryOrderDetailScreenState
    extends ConsumerState<FactoryOrderDetailScreen> {
  late Order _order;
  bool _updating = false;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
  }

  Color _statusColor(String status) => switch (status) {
        'PENDING' => Colors.orange,
        'IN_PROGRESS' => Colors.blue,
        'DONE' => Colors.green,
        'FLAGGED' => Colors.red,
        _ => Colors.grey,
      };

  Future<void> _setStatus(String newStatus) async {
    setState(() => _updating = true);
    try {
      await ref
          .read(ordersProvider.notifier)
          .updateOrderStatus(_order.id, newStatus);
      await ref.read(ordersProvider.notifier).refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _updating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(ordersProvider, (_, next) {
      final orders = next.valueOrNull ?? [];
      final updated = orders.where((o) => o.id == _order.id).firstOrNull;
      if (updated != null) setState(() => _order = updated);
    });

    return Scaffold(
      appBar: AppBar(title: Text(_order.customerName)),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left side — order details
          Expanded(
            flex: 3,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Order header
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                _order.customerName,
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall
                                    ?.copyWith(fontWeight: FontWeight.bold),
                              ),
                            ),
                            Chip(
                              label: Text(
                                _order.status,
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 14),
                              ),
                              backgroundColor: _statusColor(_order.status),
                            ),
                          ],
                        ),
                        if (_order.deadline != null) ...[
                          const SizedBox(height: 8),
                          Row(children: [
                            const Icon(Icons.calendar_today,
                                size: 16, color: Colors.grey),
                            const SizedBox(width: 6),
                            Text('Deadline: ${_order.deadline}',
                                style: const TextStyle(fontSize: 15)),
                          ]),
                        ],
                        if (_order.notes != null &&
                            _order.notes!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(_order.notes!,
                              style: TextStyle(color: Colors.grey[700])),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // Items list
                if (_order.items.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: Text('No items on this order.')),
                    ),
                  )
                else
                  ..._order.items
                      .map((item) => _buildItemCard(context, item)),
              ],
            ),
          ),

          // Right side — status controls
          SizedBox(
            width: 240,
            child: Card(
              margin: const EdgeInsets.all(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Update Status',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    _statusButton('PENDING', Colors.orange, Icons.schedule),
                    const SizedBox(height: 8),
                    _statusButton(
                        'IN_PROGRESS', Colors.blue, Icons.play_arrow),
                    const SizedBox(height: 8),
                    _statusButton('DONE', Colors.green, Icons.check_circle),
                    const SizedBox(height: 8),
                    _statusButton('FLAGGED', Colors.red, Icons.flag),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusButton(String status, Color color, IconData icon) {
    final isCurrent = _order.status == status;
    return OutlinedButton.icon(
      onPressed: _updating || isCurrent ? null : () => _setStatus(status),
      icon: Icon(icon, color: isCurrent ? Colors.white : color),
      label: Text(status.replaceAll('_', ' ')),
      style: OutlinedButton.styleFrom(
        backgroundColor: isCurrent ? color : null,
        foregroundColor: isCurrent ? Colors.white : color,
        side: BorderSide(color: color),
        padding: const EdgeInsets.symmetric(vertical: 14),
      ),
    );
  }

  Widget _buildItemCard(BuildContext context, OrderItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${item.pieceType} x${item.quantity}',
              style:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const Divider(),
            if (item.customisations.isNotEmpty) ...[
              const Text('Customisations',
                  style: TextStyle(
                      fontWeight: FontWeight.w500, color: Colors.grey)),
              const SizedBox(height: 4),
              ...item.customisations.map((c) => Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 2),
                    child: Text('${c.key}: ${c.value}'),
                  )),
              const SizedBox(height: 8),
            ],
            if (item.measurements.isNotEmpty) ...[
              const Text('Measurements',
                  style: TextStyle(
                      fontWeight: FontWeight.w500, color: Colors.grey)),
              const SizedBox(height: 4),
              ...item.measurements.map((m) => Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 2),
                    child: Text('${m.key}: ${m.value}'),
                  )),
            ],
            if (item.customisations.isEmpty && item.measurements.isEmpty)
              const Text('No details',
                  style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
