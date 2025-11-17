from django.db import migrations, models


def default_board():
    return ["", "", "", "", "", "", "", "", ""]


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Game",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("open", "open"), ("in_progress", "in_progress"), ("finished", "finished"), ("closed", "closed")], default="open", max_length=20)),
                ("board", models.JSONField(default=default_board)),
                ("next_turn", models.CharField(choices=[("X", "X"), ("O", "O")], max_length=1, null=True)),
                ("result", models.CharField(blank=True, choices=[("x_win", "x_win"), ("o_win", "o_win"), ("draw", "draw")], max_length=10, null=True)),
                ("moves", models.JSONField(default=list)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("rating_processed", models.BooleanField(default=False)),
                ("creator", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="created_games", to="api.member")),
                ("opponent", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="joined_games", to="api.member")),
                ("x_player", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="x_games", to="api.member")),
                ("o_player", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="o_games", to="api.member")),
            ],
        ),
    ]
