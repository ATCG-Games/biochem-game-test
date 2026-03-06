# Tutorial followed: https://www.youtube.com/watch?v=x5RVUs6Qhls

extends Control
class_name Card

var selected: bool = false
var mouse_in: bool = false


# Generate an ID for the card, in case if it'll ever be needed.
static var nextID: int = 0
@onready var ID: int = nextID
func _ready(): nextID += 1



func _physics_process(_delta: float) -> void:
	# Change the position of the card accordingly.
	if (mouse_in or selected) and GlobalBrain.node_being_dragged in [null, self]:
		if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
			position = lerp(position, get_global_mouse_position() - size/2, 20 * _delta)
			selected = true
			GlobalBrain.node_being_dragged = self
		else:
			selected = false
			if GlobalBrain.node_being_dragged == self:
				GlobalBrain.node_being_dragged = null
	
	# Snap the card back into the frame.
	if not selected:
		position = lerp(
			position,
			position.clamp(Vector2.ZERO, get_viewport().size - Vector2i(size)),
			20 * _delta
		)



func _on_mouse_entered() -> void: mouse_in = true
func _on_mouse_exited()  -> void: mouse_in = false



# Creating a card:
'
@export var CARD_SCENE: PackedScene = preload("res://Game Project/card/card.tscn")
func spawn_card(color: Color = Color(1,1,1), pos: Vector2 = get_viewport().size/2.0):
	var card = CARD_SCENE.instantiate()
	add_child(card)
	
	card.get_node("Label").text = str(card.ID)
	card.modulate = color
	card.position = pos - card.size / 2.0
'
