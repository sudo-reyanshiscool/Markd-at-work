class Measurement {
  final String id;
  final String orderItemId;
  final String key;
  final String value;
  final DateTime createdAt;

  const Measurement({
    required this.id,
    required this.orderItemId,
    required this.key,
    required this.value,
    required this.createdAt,
  });

  factory Measurement.fromJson(Map<String, dynamic> json) => Measurement(
        id: json['id'] as String,
        orderItemId: json['order_item_id'] as String,
        key: json['key'] as String,
        value: json['value'] as String,
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'order_item_id': orderItemId,
        'key': key,
        'value': value,
        'created_at': createdAt.toIso8601String(),
      };
}
