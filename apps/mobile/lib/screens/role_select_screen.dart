import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import 'order_list_screen.dart';

class RoleSelectScreen extends ConsumerWidget {
  const RoleSelectScreen({super.key});

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
              'Select your role to continue',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.grey,
                  ),
            ),
            const SizedBox(height: 48),
            FilledButton.icon(
              onPressed: () {
                ref.read(roleProvider.notifier).state = AppRole.management;
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (_) => const OrderListScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.business_center),
              label: const Text('Management'),
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
