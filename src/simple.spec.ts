describe('简单测试', () => {
  test('应该能够运行基本测试', () => {
    expect(1 + 1).toBe(2);
  });

  test('应该能够处理字符串', () => {
    const message = 'Hello World';
    expect(message).toContain('Hello');
  });
}); 