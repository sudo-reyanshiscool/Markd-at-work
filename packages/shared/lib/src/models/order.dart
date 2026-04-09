import '../enums/status.dart';

class Order {
  final String id;
  final String customerName;
  final DateTime deadline;
  final OrderStatus status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Order({
    required this.id,
    required this.customerName,
    required this.deadline,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'] as String,
        customerName: json['customer_name'] as String,
        deadline: DateTime.parse(json['deadline'] as String),
        status: OrderStatus.fromJson(json['status'] as String),
        notes: json['notes'] as String?,
        createdAt: DateTime.parse(json['created_at'] as String),
        updatedAt: DateTime.parse(json['updated_at'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'customer_name': customerName,
        'deadline': deadline.toIso8601String(),
        'status': status.toJson(),
        'notes': notes,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      };
}
