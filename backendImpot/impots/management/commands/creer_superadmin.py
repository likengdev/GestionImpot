from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from impots.models import Profil
from decouple import config


class Command(BaseCommand):
    help = "Crée ou met à jour le compte SuperAdmin (DGI) à partir des variables d'environnement"

    def handle(self, *args, **options):
        username = config('SUPERADMIN_USERNAME', default='jean')
        email = config('SUPERADMIN_EMAIL', default='dgi@impots.cm')
        password = config('SUPERADMIN_PASSWORD', default='emmanuel2706')

        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': email, 'is_staff': True, 'is_superuser': True}
        )

        if created:
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.email = email
            user.save()
            self.stdout.write(self.style.SUCCESS(f"SuperAdmin créé : {username}"))
        else:
            self.stdout.write(self.style.WARNING(f"L'utilisateur {username} existe déjà."))

        profil, _ = Profil.objects.get_or_create(user=user)
        profil.role = 'superadmin'
        profil.save()

        self.stdout.write(self.style.SUCCESS(f"Rôle '{profil.role}' attribué à {username}."))