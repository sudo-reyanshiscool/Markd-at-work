enum AppRole {
  management,
  factory;

  String toJson() => switch (this) {
        AppRole.management => 'MANAGEMENT',
        AppRole.factory => 'FACTORY',
      };

  static AppRole fromJson(String value) => switch (value) {
        'MANAGEMENT' => AppRole.management,
        'FACTORY' => AppRole.factory,
        _ => throw ArgumentError('Unknown AppRole: $value'),
      };
}
