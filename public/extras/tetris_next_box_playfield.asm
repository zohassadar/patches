; assembles with snarfblasm

tetriminoX = $40
tetriminoY = $41
fallTimer = $45
playState = $48
player1_tetriminoX = $60
player1_tetriminoY = $61


.patch $16fa
.org $96ea
vramPlayfieldRows:
    .word $21d2, $21d2, $21d2, $21d2
    .word $21d2, $21d2, $21d2, $21d2
    .word $21d2, $21d2, $21d2, $21d2
    .word $21d2, $21d2, $21d2, $21d2
    .word $21d2, $21f2, $2212, $2232


.patch $6ff
.org $86ef
    ; @initStatsByType, after bne @initStatsByType
    lda #2
    sta player1_tetriminoX
    lda #16
    sta player1_tetriminoY
    lda #0

.patch $1777
.org $9767
    ldx #4 ; number of columns to draw

.patch $18a4
.org $9894
    ; playState_spawnNextTetrimino, after bmi @ret
    ldx #0
    stx fallTimer
    inx
    stx playState
    inx
    stx tetriminoX
    ldx #16
    stx tetriminoY
    jmp $98ca ; to ldx nextPiece

.patch $a20
    .db $c0 ; current piece x offset

.patch $a43
    .db $ef ; current piece y offset

.patch $be3
    .db $80 ; next piece x offset

.patch $be7
    .db $2f ; next piece y offset

.patch $4387
    .db %10101111 ; top of next box attribute table

.patch $4392
    .db %11111010 ; bottom of next box attribute table

.patch $1a9e
    .db 4 ; number of columns checked during line clear check

.patch $14ec
    .db 4 ; width of playfield (for valid piece position check)

.patch $180e
.org $97fe
leftColumns:
    .db 1, 0, 0, 0, 0
rightColumns:
    .db 2, 3, 3, 3, 3