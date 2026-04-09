import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import 'order_queue_screen.dart';

class FactoryLoginScreen extends ConsumerWidget {
  const FactoryLoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Markd at Work',
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Factory Floor',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.grey,
                  ),
            ),
            const SizedBox(height: 48),
            FilledButton.icon(
              onPressed: () {
                ref.read(roleProvider.notifier).state = AppRole.factory_;
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (_) => const OrderQueueScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.factory),
              label: const Text('Enter Factory'),
              style: FilledButton.styleFrom(
                minimumSize: const Size(220, 56),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
