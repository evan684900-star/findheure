# findheure

Horloge plein écran personnalisable, en une seule page (`index.html` + `support.js`).

- **Thème par défaut : Halloween** — cimetière, citrouilles, chauves-souris, fantôme, lune et brume.
- **Saisons & fêtes** avec décors animés : Rentrée, Automne, Halloween, Hiver, Noël, Nouvel An, Saint-Valentin, Printemps, Poisson d’avril, Pâques, Fête de la musique, Été, 14 Juillet — et un bouton pour **changer de thème tout seul selon la date**.
- **Autres thèmes** : Papier, Néon, Terminal, Grille (cases qui s’allument derrière la souris), Hologramme, Psyché…
- **Animations des chiffres** (fondu, chute, toupie, fonte, rebond, glitch, machine à sous…) et **effets bizarres** permanents (vague, gelée, tremblote, lévitation, arc-en-ciel, liquide, hologramme, reflet…).
- **Minuteur visuel** (disque qui se vide et passe du vert à l’orange puis au rouge) et **chrono** (avec tours), dessinés dans le style choisi.
- **Tuto** à la première visite : une flèche montre chaque bouton avec son explication (bouton « ? » pour le revoir).
- **Notes autocollantes** déplaçables et redimensionnables.
- **Icône du site** (onglet, favoris, écran d’accueil) : on peut aussi « installer » le site comme une appli depuis le navigateur.

Raccourcis : `F` plein écran · `S` surprise · `N` nouvelle note · `Espace` démarrer/pause · `R` remettre à zéro · `L` tour (chrono) · `Échap` fermer.

Les réglages, styles, notes et minuteurs sont enregistrés dans le navigateur : rien n’est envoyé nulle part.
React est servi depuis le dossier `vendor/`, pour que le site marche même sur les réseaux d’établissement qui bloquent les sites externes.

Pour l’ouvrir en local, servir le dossier (par exemple `python3 -m http.server`) puis ouvrir `http://localhost:8000`.
