import turtle


def draw_L_system(axiom,
                  rule,
                  depth,
                  delta_angle,
                  line_length):
    checkpoints = []
    t = turtle.Pen()
    t.left(90) # turtle looks up

    def generate_sentence(sentence, rule, current_depth):
        next_sentence = ''
        for char in sentence:
            if char == 'F':
                next_sentence += rule
            else:
                next_sentence += char

        if current_depth > 0:
            return generate_sentence(next_sentence, rule, current_depth - 1)

        return next_sentence

    def do_iteration(sentence):
        for char in sentence:
            if char == '+':
                t.left(delta_angle)
            elif char == '-':
                t.right(delta_angle)
            elif char == '[':
                checkpoints.append({
                    'position': t.pos(),
                    'heading': t.heading(),
                    })
            elif char == ']':
                backpoint = checkpoints.pop()
                t.setpos(backpoint['position'])
                t.setheading(backpoint['heading'])
            elif char == 'F':
                t.forward(line_length)
            else:
                raise ValueError('Bad character in the axiom')

    sentence = generate_sentence(axiom, rule, depth)
    do_iteration(sentence)

draw_L_system('F', 'F[+F][-F]', 6, 30, 50)
