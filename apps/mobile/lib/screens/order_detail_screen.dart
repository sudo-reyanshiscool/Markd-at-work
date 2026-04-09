import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/orders_provider.dart';

class OrderDetailScreen extends ConsumerStatefulWidget {
  final Order order;
  const OrderDetailScreen({super.key, required this.order});

  @override
  ConsumerState<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends ConsumerState<OrderDetailScreen> {
  late Order _order;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
  }

  void _listenForUpdates() {
    final orders = ref.read(ordersProvider).valueOrNull ?? [];
    final updated = orders.where((o) => o.id == _order.id).firstOrNull;
    if (updated != null) {
      setState(() => _order = updated);
    }
  }

  Color _statusColor(String status) => switch (status) {
        'PENDING' => Colors.orange,
        'IN_PROGRESS' => Colors.blue,
        'DONE' => Colors.green,
        'FLAGGED' => Colors.red,
        _ => Colors.grey,
      };

  Future<void> _addItem() async {
    final pieceCtrl = TextEditingController();
    final qtyCtrl = TextEditingController(text: '1');

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Item'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: pieceCtrl,
              decoration: const InputDecoration(
                labelText: 'Piece Type',
                hintText: 'e.g. Shirt, Trousers',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: qtyCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Quantity'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Add'),
          ),
        ],
      ),
    );

    if (result != true || pieceCtrl.text.trim().isEmpty) return;

    await ref.read(ordersProvider.notifier).addItem(
          orderId: _order.id,
          pieceType: pieceCtrl.text.trim(),
          quantity: int.tryParse(qtyCtrl.text) ?? 1,
        );
    await ref.read(ordersProvider.notifier).refresh();
    _listenForUpdates();
  }

  Future<void> _addKeyValue({
    required String title,
    required Future<void> Function({
      required String orderItemId,
      required String key,
      required String value,
    }) onAdd,
    required String itemId,
  }) async {
    final keyCtrl = TextEditingController();
    final valCtrl = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Add $title'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: keyCtrl,
              decoration: InputDecoration(
                labelText: title == 'Customisation'
                    ? 'Key (e.g. Fabric, Colour)'
                    : 'Key (e.g. Chest, Waist)',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: valCtrl,
              decoration: const InputDecoration(labelText: 'Value'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Add'),
          ),
        ],
      ),
    );

    if (result != true ||
        keyCtrl.text.trim().isEmpty ||
        valCtrl.text.trim().isEmpty) return;

    await onAdd(
      orderItemId: itemId,
      key: keyCtrl.text.trim(),
      value: valCtrl.text.trim(),
    );
    await ref.read(ordersProvider.notifier).refresh();
    _listenForUpdates();
  }

  Future<void> _deleteOrder() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Order?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;
    await ref.read(ordersProvider.notifier).deleteOrder(_order.id);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    // Keep in sync with provider changes
    ref.listen(ordersProvider, (_, next) {
      final orders = next.valueOrNull ?? [];
      final updated = orders.where((o) => o.id == _order.id).firstOrNull;
      if (updated != null) setState(() => _order = updated);
    });

    return Scaffold(
      appBar: AppBar(
        title: Text(_order.customerName),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: _deleteOrder,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addItem,
        child: const Icon(Icons.add),
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
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
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                      Chip(
                        label: Text(
                          _order.status,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12),
                        ),
                        backgroundColor: _statusColor(_order.status),
                      ),
                    ],
                  ),
                  if (_order.deadline != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today,
                              size: 16, color: Colors.grey),
                          const SizedBox(width: 6),
                          Text('Deadline: ${_order.deadline}'),
                        ],
                      ),
                    ),
                  if (_order.notes != null && _order.notes!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        _order.notes!,
                        style: TextStyle(color: Colors.grey[700]),
                      ),
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Items
          if (_order.items.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text('No items yet. Tap + to add a piece.'),
                ),
              ),
            )
          else
            ..._order.items.map((item) => _buildItemCard(item)),
        ],
      ),
    );
  }

  Widget _buildItemCard(OrderItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${item.pieceType} x${item.quantity}',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 16),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, size: 20),
                  onPressed: () async {
                    await ref
                        .read(ordersProvider.notifier)
                        .deleteItem(item.id);
                    await ref.read(ordersProvider.notifier).refresh();
                    _listenForUpdates();
                  },
                ),
              ],
            ),
            const Divider(),

            // Customisations
            Row(
              children: [
                const Text('Customisations',
                    style: TextStyle(fontWeight: FontWeight.w500)),
                const Spacer(),
                TextButton.icon(
                  onPressed: () => _addKeyValue(
                    title: 'Customisation',
                    onAdd: ref.read(ordersProvider.notifier).addCustomisation,
                    itemId: item.id,
                  ),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add'),
                ),
              ],
            ),
            if (item.customisations.isEmpty)
              const Text('  None',
                  style: TextStyle(color: Colors.grey, fontSize: 13))
            else
              ...item.customisations.map((c) => Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    child: Row(
                      children: [
                        Text('${c.key}: ',
                            style:
                                const TextStyle(fontWeight: FontWeight.w500)),
                        Expanded(child: Text(c.value)),
                        GestureDetector(
                          onTap: () async {
                            await ref
                                .read(ordersProvider.notifier)
                                .deleteCustomisation(c.id);
                            await ref.read(ordersProvider.notifier).refresh();
                            _listenForUpdates();
                          },
                          child: const Icon(Icons.close,
                              size: 16, color: Colors.grey),
                        ),
                      ],
                    ),
                  )),

            const SizedBox(height: 8),

            // Measurements
            Row(
              children: [
                const Text('Measurements',
                    style: TextStyle(fontWeight: FontWeight.w500)),
                const Spacer(),
                TextButton.icon(
                  onPressed: () => _addKeyValue(
                    title: 'Measurement',
                    onAdd: ref.read(ordersProvider.notifier).addMeasurement,
                    itemId: item.id,
                  ),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add'),
                ),
              ],
            ),
            if (item.measurements.isEmpty)
              const Text('  None',
                  style: TextStyle(color: Colors.grey, fontSize: 13))
            else
              ...item.measurements.map((m) => Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    child: Row(
                      children: [
                        Text('${m.key}: ',
                            style:
                                const TextStyle(fontWeight: FontWeight.w500)),
                        Expanded(child: Text(m.value)),
                        GestureDetector(
                          onTap: () async {
                            await ref
                                .read(ordersProvider.notifier)
                                .deleteMeasurement(m.id);
                            await ref.read(ordersProvider.notifier).refresh();
                            _listenForUpdates();
                          },
                          child: const Icon(Icons.close,
                              size: 16, color: Colors.grey),
                        ),
                      ],
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}
