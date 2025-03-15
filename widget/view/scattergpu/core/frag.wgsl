struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) localPos: vec2<f32>,   
  @location(2) strokeColor: vec4<f32>, 
  @location(3) strokeWidth: f32, 
  @location(4) @interpolate(flat) symbol: u32      
};

fn is_inside_circle_stroke(pos: vec2<f32 >, strokeWidth: f32) -> bool {
    let innerRadius = 1.0 - strokeWidth * 2.0;
    let dist = length(pos);
    return dist > innerRadius && dist <= 1.0;
}



fn is_inside_square_stroke(pos: vec2<f32>, strokeWidth: f32) -> bool {
    let innerSize = 1.0 - strokeWidth * 2.0;
    return (abs(pos.x) > innerSize || abs(pos.y) > innerSize) && abs(pos.x) <= 1.0 && abs(pos.y) <= 1.0;
}


//triangle: [-0.5, -0.5, 0.0, 0.433, 0.5, -0.5],
//TODO: 
fn is_inside_triangle_stroke(pos: vec2<f32>, strokeWidth: f32) -> bool {
    // 삼각형의 꼭짓점들 (로컬 좌표 공간에서)
    let A = vec2<f32>(-1.0, -1.0);
    let B = vec2<f32>(0.0, 0.73);
    let C = vec2<f32>(1.0, -1.0);
    
    // 삼각형 면적 계산 (절대값)
    let area = abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y));
    
    // 각 꼭짓점에 대한 픽셀 p의 barycentric 좌표를 계산
    let lambda1 = abs((B.x - pos.x) * (C.y - pos.y) - (C.x - pos.x) * (B.y - pos.y)) / area;
    let lambda2 = abs((C.x - pos.x) * (A.y - pos.y) - (A.x - pos.x) * (C.y - pos.y)) / area;
    let lambda3 = abs((A.x - pos.x) * (B.y - pos.y) - (B.x - pos.x) * (A.y - pos.y)) / area;
    
    // 최소의 barycentric 값: 모서리에 가까울수록 이 값이 작아짐
    let minLambda = min(lambda1, min(lambda2, lambda3));
    
    // minLambda가 strokeWidth보다 작으면 모서리 영역으로 판단
    return minLambda < strokeWidth;
}

fn is_inside_diamond_stroke(pos: vec2<f32>, strokeWidth: f32) -> bool {
    let outerSize = 1.0;
    let innerSize = outerSize - strokeWidth * 2.0;

    let dist = abs(pos.x) + abs(pos.y);

    return dist > innerSize && dist <= outerSize;
}

fn is_inside_cross_stroke(pos: vec2<f32>, strokeWidth: f32) -> bool {
    let inner_cross = abs(pos.x) <= (0.4 - strokeWidth) || abs(pos.y) <= (0.4 - strokeWidth);
    let boundary = abs(pos.x) >= 1.0 - strokeWidth || abs(pos.y) >= 1.0 - strokeWidth;
    
    // stroke 영역은 경계에서 strokeWidth 이내인 영역으로 정의
    return (!inner_cross || boundary) && (abs(pos.x) <= 0.4 || abs(pos.y) <= 0.4);
}

fn soft_edge_circle(pos: vec2<f32>, strokeWidth: f32) -> f32 {
    let dist = length(pos);
    let edge = 1.0; // 원의 경계
    let fadeStart = 0.95; // 부드러워지는 시작점
    return smoothstep(edge, fadeStart, dist);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    var inside: bool = false;
    var isStroke: bool = false;
    let pos = input.localPos;
    var alpha: f32 = input.color.a;

    switch input.symbol {
        case 0u: { // Circle
            inside = length(pos) <= 1.0;
            isStroke = is_inside_circle_stroke(input.localPos, input.strokeWidth);
            let edgeFactor = soft_edge_circle(pos, input.strokeWidth);
            alpha *= edgeFactor;
        }
        case 1u: { // Square
            inside = abs(pos.x) <= 1.0 && abs(pos.y) <= 1.0;
            isStroke = is_inside_square_stroke(input.localPos, input.strokeWidth);
        }
        case 2u: { // Triangle
            inside = pos.y >= -1.0 && 1.73 * pos.x + 0.73 >= pos.y && -1.73 * pos.x + 0.73 >= pos.y;
            isStroke = is_inside_triangle_stroke(input.localPos, input.strokeWidth);
        }
        case 3u: { // Diamond
            inside = abs(pos.x) + abs(pos.y) <= 1.0;
            isStroke = is_inside_diamond_stroke(input.localPos, input.strokeWidth);
        }
        case 4u: { // Cross
            inside = (abs(pos.x) <= 0.4) || (abs(pos.y) <= 0.4);
            isStroke = is_inside_cross_stroke(input.localPos, input.strokeWidth);
        }
        default: {
            discard;
        }
    }

    if !inside {
        discard;
    }

    var finalColor: vec4<f32> = input.color;
    if input.strokeWidth > 0.0 && isStroke {
        finalColor = input.strokeColor;
    }

    return vec4<f32>(finalColor.rgb, alpha);
}
