import threading
import smtplib
from django.core.mail import send_mail
from django.conf import settings


def _envoyer_email_et_mettre_a_jour(notification, contribuable_email, sujet, message):
    """Envoi dans un thread — met à jour la notification si succès."""
    try:
        if not contribuable_email:
            print(f"⚠️  Pas d'email pour le contribuable, notification {notification.id} non envoyée.")
            return

        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            print("⚠️  Configuration SMTP manquante : EMAIL_HOST_USER ou EMAIL_HOST_PASSWORD absent.")
            return

        send_mail(
            subject=sujet,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[contribuable_email],
            fail_silently=False,
        )
        notification.email_envoye = True
        notification.save()
        print(f"✅ Email de notification envoyé à {contribuable_email}")

    except smtplib.SMTPAuthenticationError:
        print("❌ Erreur SMTP : authentification échouée. Vérifiez EMAIL_HOST_USER / EMAIL_HOST_PASSWORD.")
    except smtplib.SMTPException as e:
        print(f"❌ Erreur SMTP lors de l'envoi à {contribuable_email} : {e}")
    except Exception as e:
        print(f"❌ Erreur inattendue lors de l'envoi à {contribuable_email} : {e}")


def envoyer_email_notification(contribuable, sujet, message, type_notification):
    from .models import Notification
    notification = Notification.objects.create(
        contribuable=contribuable,
        type_notification=type_notification,
        sujet=sujet,
        message=message,
        email_envoye=False
    )
    thread = threading.Thread(
        target=_envoyer_email_et_mettre_a_jour,
        args=(notification, contribuable.email, sujet, message),
        daemon=False,  # CORRIGÉ : daemon=False pour garantir l'exécution complète
    )
    thread.start()
    return notification


def envoyer_notification_paiement(paiement):
    contribuable = paiement.impot.contribuable
    envoyer_email_notification(
        contribuable,
        f"Confirmation de paiement — {paiement.reference}",
        f"Bonjour {contribuable.nom} {contribuable.prenom},\n\n"
        f"Votre paiement a été enregistré avec succès.\n"
        f"Référence : {paiement.reference}\n"
        f"Montant   : {paiement.montant_paye} FCFA\n\n"
        f"Cordialement,\nGestImpôts",
        'paiement'
    )


def envoyer_notification_penalite(penalite):
    contribuable = penalite.impot.contribuable
    envoyer_email_notification(
        contribuable,
        f"Avis de pénalité — {contribuable.nif}",
        f"Bonjour {contribuable.nom} {contribuable.prenom},\n\n"
        f"Une pénalité a été appliquée sur votre dossier fiscal.\n"
        f"Motif   : {penalite.motif}\n"
        f"Montant : {penalite.montant} FCFA\n\n"
        f"Cordialement,\nGestImpôts",
        'penalite'
    )


def envoyer_notification_declaration(declaration):
    contribuable = declaration.contribuable
    statut_labels = {
        'soumise': 'soumise pour validation',
        'validee': 'validée',
        'rejetee': 'rejetée',
    }
    label = statut_labels.get(declaration.statut, declaration.statut)
    envoyer_email_notification(
        contribuable,
        f"Déclaration {label} — {declaration.periode}",
        f"Bonjour {contribuable.nom} {contribuable.prenom},\n\n"
        f"Votre déclaration fiscale a été mise à jour.\n"
        f"Statut  : {label}\n"
        f"Période : {declaration.periode}\n"
        f"Montant : {declaration.montant_declare} FCFA\n\n"
        f"Cordialement,\nGestImpôts",
        'declaration'
    )