Add a GM panel that shows a list of the characters added, and allows the GM to add new characters, edit existing ones, or remove them. Add a load/save for JSON to this page, so the GM can load/save each character to a file between sessions.

We have 'rooms' already that are collections of floors, walls, and doors. We can use that to our advantage. Once they are defined, the player will be shown the room description and list of items visible in the room, in their left panel, along with their character and its items. The player will be able to pick up and drop items, and use items on objects in the room, by dragging them from the world to their character, or dropping them from their character into the world. The item should be dropped where they are standing. IF they drag an item into their world view, onto an character, creature, or item, it should be offered to that character or creature, or place into or onto the item.

Add a 'object type' to the world. This should identify what type of object something is. That way there can be multiple instances (objects) of the same type. For example, a 'blue key' could be type 101. Multiple blue keys could exist, but they would all be type 101. A lock would be opened by a key of type 101.

Add a 'key' item to the world and place it randomly outside our starting rooms, along the edge of our generated world. The key is a small item that can be picked up and dropped. The key should have a description, and should be able to be used to open specific doors, as its type will be 101. 

Since each item has a unique number, the door should have a 'key number' field that the GM can edit, specific to the door, which can be used by a player or NPC to lock or unlock the door, if they have that key-type.

Remove the title from the app bar at the top of the view, and place icons for primary mode as "GM", "Player", "Build".

The build-mode would show the quick-bar with icons for Select, Floor, Wall, Door, Room, Erase, Color. When in wall mode, show additional icons on the top of the wall properties panel, as build (the build-mode for walls we curently have), update (applies color and other wall properties from the new-wall object to the selected objects), and delete (deletes the selected objects). Do the same for floor and door modes. This simplifies the main toolbar to have the Select, Floor, Wall, Door, Room, Erase, Color icons. 

The select icon should be available to all primary modes, allowing GM, Player and Build modes to select objects. The properties shown to the user will depend on the mode.
- In build mode, all properties are editable.
- In gm mode, all properties are editable.
- In player mode, properties are read-only.

The GM primary mode will show the world to the GM. The GM can edit properties of objects, add/remove items, open/close and lock/unlock doors (without needing a key), and update descriptions of objects and items. The GM can also move the player and creature and NPC characters.

The player primary mode will show the world to the player from the first-person perspective. The player can move the player character only, using mouse to look around, and AWSD to move the character. The character cannot pass through a wall, closed door, or fixed object. The player can also open and close doors, and lock and unlock doors (if they have the door key of the correct type).

Add a 'player' panel to the left of the scene panel. This panel should show the a character link (to show the character detail on the properties panel), and inventory (so they can select an item instead to show its properties on the right), and allow the player to pick up and drop items. The player should also have a 'health' and 'mana' bar, and a 'gold' amount. Add action button for attack, cast, use, and drop. Add a 'skills' panel to the right of the scene panel. This panel should show the player's skills, and allow the player to use them.

For the player, the panel on the left should show the current character that the player owns, usually only one, with a drop-down to switch between multiple if they ahve more than one they control. For the character selected, show the properties of the character on the right, including their detailed skills and abililities. 
