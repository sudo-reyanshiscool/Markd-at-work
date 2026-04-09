enum OrderStatus {
  pending,
  inProgress,
  done,
  flagged;

  String toJson() => switch (this) {
        OrderStatus.pending => 'PENDING',
        OrderStatus.inProgress => 'IN_PROGRESS',
        OrderStatus.done => 'DONE',
        OrderStatus.flagged => 'FLAGGED',
      };

  static OrderStatus fromJson(String value) => switch (value) {
        'PENDING' => OrderStatus.pending,
        'IN_PROGRESS' => OrderStatus.inProgress,
        'DONE' => OrderStatus.done,
        'FLAGGED' => OrderStatus.flagged,
        _ => throw ArgumentError('Unknown OrderStatus: $value'),
      };
}
