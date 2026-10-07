# findheure

Horloge plein écran personnalisable, en une seule page (`index.html` + `support.js`, décors dans `scenes.js`).

- **Thème par défaut : Halloween** — cimetière, citrouilles, chauves-souris, fantôme, lune et brume.
- **Saisons & fêtes**, chacune avec son vrai décor animé : Rentrée (tableau noir à la craie), Automne (forêt, feuilles qui tombent), Halloween, Hiver (montagnes, aurore boréale, chalet), Noël (village enneigé, sapin illuminé, traîneau), Nouvel An (ville et feux d’artifice), Saint-Valentin, Printemps (cerisiers, papillons), Poisson d’avril (fond marin), Pâques (lapin, poussins, œufs), Fête de la musique (concert), Été (plage, voilier, vagues), 14 Juillet (tour Eiffel qui scintille) — et un bouton pour **changer de thème tout seul selon la date**.
- **Autres thèmes**, eux aussi avec leur décor : Papier (feuille Seyès, avions en papier), Néon (rue sous la pluie), Terminal (écran cathodique), Coucher de soleil (synthwave), Bonbon, Brutal, Cosmos (planètes, astronaute), Arcade (envahisseurs en pixels), Luxe (Art déco), Matrice (tableau à LED), Glacier (icebergs, manchots), Iso 3D (ville isométrique), Gothique (vitraux, bougies), Grille (cases qui s’allument derrière la souris), Hologramme, Psyché.
- Les décors ne bougent qu’avec des animations légères (fluides même sur un vieil ordinateur) et un voile doux derrière l’heure la garde lisible. Tous les boutons et textes sont vérifiés pour rester lisibles sur chaque thème.
- **Animations des chiffres** (fondu, chute, toupie, fonte, rebond, glitch, machine à sous…) et **effets bizarres** permanents (vague, gelée, tremblote, lévitation, arc-en-ciel, liquide, hologramme, reflet…).
- **Minuteur visuel** (disque qui se vide et passe du vert à l’orange puis au rouge) et **chrono** (avec tours), dessinés dans le style choisi. Durées toutes prêtes ou **Personnaliser** pour taper heures, minutes et secondes.
- **Sonnerie de fin** au choix (carillon, cloche, sonnerie d’école, réveil, gong) avec volume et bouton « Écouter » : elle sonne une fois, fort, et part à l’heure même si l’onglet est en arrière-plan.
- **Sonomètre** : un cadran montre le bruit de la classe (vert → rouge), avec seuil d’alerte, sensibilité, compteur de dépassements et bip en option. Le son est analysé dans le navigateur, rien n’est enregistré ni envoyé.
- **Afficher sur l’horloge** : le minuteur, le chrono et le sonomètre restent sur l’écran de l’heure, dans des cartes qu’on déplace à la souris et qu’on agrandit (− / +) ; double-clic pour les ranger dans le coin.
- **Site ou image** : afficher un site (YouTube, Google Slides, Canva…) ou un fichier de l’ordinateur (image, vidéo, PDF) en plein écran, avec l’heure dans une carte qu’on déplace et qu’on agrandit. Certains sites (Pronote, ENT, Google) refusent d’être affichés dans un autre site.
- **Tuto** à la première visite : une flèche montre chaque bouton avec son explication.
- **Guide complet** (bouton « ? ») : 28 étapes qui expliquent tout en détail ; à certaines, c’est toi qui fais (« À toi : clique sur… ») et le guide passe à la suite tout seul quand c’est fait.
- Quand le fond est une de tes photos (par exemple après « Surprends-moi »), un bouton **Supprimer cette image** apparaît en bas à gauche, avec annulation possible.
- **Repère de l’onglet choisi** en haut : il glisse d’un onglet à l’autre en s’étirant un peu, se tasse en arrivant et lance une petite onde. Animations très légères (seulement du CSS), coupées si l’ordinateur demande moins d’animations.
- **Notes autocollantes** déplaçables et redimensionnables.
- **Images à côté de l’heure** (bouton image de la barre, touche `I`, ou onglet Disposition) : une image de l’ordinateur posée sur l’écran, pas en fond. On la glisse où on veut, on tire le coin pour changer sa taille (ou − / +), elle reste enregistrée.
- **Taille de l’heure et de la date** réglables dans l’onglet Disposition (et Police).
- **Icône du site** (onglet, favoris, écran d’accueil) : on peut aussi « installer » le site comme une appli depuis le navigateur.

Raccourcis : `F` plein écran · `S` surprise · `N` nouvelle note · `I` image à côté de l’heure · `Espace` démarrer/pause · `R` remettre à zéro · `L` tour (chrono) · `Échap` fermer.

Les réglages, styles, notes et minuteurs sont enregistrés dans le navigateur : rien n’est envoyé nulle part.
React est servi depuis le dossier `vendor/`, pour que le site marche même sur les réseaux d’établissement qui bloquent les sites externes.

Pour l’ouvrir en local, servir le dossier (par exemple `python3 -m http.server`) puis ouvrir `http://localhost:8000`.
