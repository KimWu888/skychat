DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `username` varchar(32) NOT NULL,
  `username_custom` varchar(32) NOT NULL,
  `password` varchar(256) NOT NULL,
  `data` varchar(1024) NOT NULL,
  `tms_created` int NOT NULL,
  `tms_last_seen` int NOT NULL,
  CONSTRAINT username_unique UNIQUE(username)
);