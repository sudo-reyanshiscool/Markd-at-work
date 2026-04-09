import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AppRole { management, factory_ }

final roleProvider = StateProvider<AppRole?>((ref) => null);
