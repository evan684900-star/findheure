# findheure

Horloge plein écran personnalisable, en une seule page (`index.html` + `support.js`).

- **Thème par défaut : Halloween** — cimetière, citrouilles, chauves-souris, fantôme, lune et brume.
- **Saisons & fêtes** avec décors animés : Rentrée, Automne, Halloween, Hiver, Noël, Nouvel An, Saint-Valentin, Printemps, Poisson d’avril, Pâques, Fête de la musique, Été, 14 Juillet — et un bouton pour **changer de thème tout seul selon la date**.
- **Autres thèmes** : Papier, Néon, Terminal, Grille (cases qui s’allument derrière la souris), Hologramme, Psyché…
- **Animations des chiffres** (fondu, chute, toupie, fonte, rebond, glitch, machine à sous…) et **effets bizarres** permanents (vague, gelée, tremblote, lévitation, arc-en-ciel, liquide, hologramme, reflet…).
- **Minuteur visuel** (disque qui se vide et passe du vert à l’orange puis au rouge) et **chrono** (avec tours), dessinés dans le style choisi.
- **Sonomètre** : un cadran montre le bruit de la classe (vert → rouge), avec seuil d’alerte, sensibilité, compteur de dépassements et bip en option. Le son est analysé dans le navigateur, rien n’est enregistré ni envoyé.
- **Afficher sur l’horloge** : le minuteur, le chrono et le sonomètre restent sur l’écran de l’heure, dans des cartes qu’on déplace à la souris et qu’on agrandit (− / +) ; double-clic pour les ranger dans le coin.
- **Site ou image** : afficher un site (YouTube, Google Slides, Canva…) ou un fichier de l’ordinateur (image, vidéo, PDF) en plein écran, avec l’heure dans une carte qu’on déplace et qu’on agrandit. Certains sites (Pronote, ENT, Google) refusent d’être affichés dans un autre site.
- **Tuto** à la première visite : une flèche montre chaque bouton avec son explication (bouton « ? » pour le revoir).
- **Notes autocollantes** déplaçables et redimensionnables.
- **Icône du site** (onglet, favoris, écran d’accueil) : on peut aussi « installer » le site comme une appli depuis le navigateur.

Raccourcis : `F` plein écran · `S` surprise · `N` nouvelle note · `Espace` démarrer/pause · `R` remettre à zéro · `L` tour (chrono) · `Échap` fermer.

Les réglages, styles, notes et minuteurs sont enregistrés dans le navigateur : rien n’est envoyé nulle part.
React est servi depuis le dossier `vendor/`, pour que le site marche même sur les réseaux d’établissement qui bloquent les sites externes.

Pour l’ouvrir en local, servir le dossier (par exemple `python3 -m http.server`) puis ouvrir `http://localhost:8000`.
